import NotificationLog from "../models/NotificationLog.js";
import Settings from "../models/Settings.js";
import { NOTIFICATION_CHANNELS, NOTIFICATION_TYPES } from "../constants/notificationTypes.js";
import { buildAbsentTemplates, buildMarksTemplates } from "./notificationTemplates.js";

const defaultSettings = {
  notifySmsEnabled: true,
  notifyEmailEnabled: true,
  notifyMarksEnabled: true,
};

const SUBJECT_LINE = "CampusFlow Notification";
const MAX_RETRIES = 3;

const getSettings = async () => {
  const settings = await Settings.findOne({ singleton: "default" }).lean();
  return { ...defaultSettings, ...(settings || {}) };
};

const retry = async (fn, attempts = MAX_RETRIES) => {
  let lastError = null;
  for (let i = 0; i < attempts; i += 1) {
    try {
      await fn();
      return { ok: true };
    } catch (err) {
      lastError = err;
    }
  }
  return { ok: false, error: lastError };
};

export const sendSMS = async (_phone, _message) => {
  // Integrate provider here using env keys
  return { status: "sent" };
};

export const sendEmail = async (_email, _subject, _body) => {
  // Integrate provider here using env keys
  return { status: "sent" };
};

export const sendNotification = async (student, type, data) => {
  const settings = await getSettings();

  if (type === NOTIFICATION_TYPES.MARKS && settings.notifyMarksEnabled === false) {
    return { status: "failed", reason: "marks_disabled" };
  }

  const smsEnabled = settings.notifySmsEnabled !== false;
  const emailEnabled = settings.notifyEmailEnabled !== false;

  const logFilter = {
    studentId: student._id,
    type,
    subjectId: data.subjectId,
  };

  if (type === NOTIFICATION_TYPES.ABSENT) {
    logFilter.date = data.date;
  } else if (type === NOTIFICATION_TYPES.MARKS) {
    logFilter.examType = data.examType;
  }

  let logEntry = null;
  try {
    logEntry = await NotificationLog.create({
      ...logFilter,
      classId: data.classId || null,
      examType: data.examType || null,
      date: data.date || null,
      status: "pending",
      channels: [],
      error: "",
      metadata: {
        staffId: data.staffId || null,
        staffName: data.staffName || "",
        className: data.className || "",
        subjectName: data.subjectName || "",
        marks: data.marks,
        maxMarks: data.maxMarks,
        examType: data.examType,
      },
    });
  } catch (err) {
    if (err?.code === 11000) {
      return { status: "failed", reason: "duplicate" };
    }
    console.error("NotificationLog error:", err);
    return { status: "failed", reason: "log_error" };
  }

  const studentName = student.userId?.name || student.name || "Student";
  const classLabel = data.className || "";
  const subjectName = data.subjectName || "Subject";
  const staffName = data.staffName || "Staff";

  let smsMessage = "";
  let emailBody = "";

  if (type === NOTIFICATION_TYPES.ABSENT) {
    const templates = buildAbsentTemplates({ studentName, classLabel, subjectName, staffName, date: data.date });
    smsMessage = templates.sms;
    emailBody = templates.email;
  } else if (type === NOTIFICATION_TYPES.MARKS) {
    const templates = buildMarksTemplates({
      studentName,
      classLabel,
      subjectName,
      staffName,
      examType: data.examType,
      marks: data.marks,
      maxMarks: data.maxMarks,
    });
    smsMessage = templates.sms;
    emailBody = templates.email;
  }

  const phone = student.parentPhone || "";
  const email = student.parentEmail || student.parentId?.email || "";

  const channels = [];
  const errors = [];

  if (smsEnabled && phone) {
    const result = await retry(() => sendSMS(phone, smsMessage));
    if (result.ok) {
      channels.push(NOTIFICATION_CHANNELS.SMS);
    } else {
      errors.push(`sms:${result.error?.message || "failed"}`);
    }
  }

  if (emailEnabled && email) {
    const result = await retry(() => sendEmail(email, SUBJECT_LINE, emailBody));
    if (result.ok) {
      channels.push(NOTIFICATION_CHANNELS.EMAIL);
    } else {
      errors.push(`email:${result.error?.message || "failed"}`);
    }
  }

  let status = "sent";
  if (!channels.length) status = "failed";
  if (errors.length) status = "failed";

  try {
    await NotificationLog.updateOne(
      { _id: logEntry._id },
      {
        $set: {
          status,
          channels,
          error: errors.join(" | "),
        },
      }
    );
  } catch (err) {
    console.error("NotificationLog update error:", err);
  }

  return { status, channels, errors };
};
