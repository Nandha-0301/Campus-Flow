const examTypeLabels = {
  internal1: "Internal 1",
  internal2: "Internal 2",
  assignment: "Assignment",
  final: "Final",
};

const formatDate = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleDateString();
};

export const buildAbsentTemplates = ({ studentName, classLabel, subjectName, staffName, date }) => {
  const dateLabel = formatDate(date);
  const sms = `Dear Parent, your child ${studentName} (${classLabel}) was absent on ${dateLabel} for ${subjectName} (by ${staffName}).`;
  const email = `Dear Parent,\nYour child ${studentName} (${classLabel})\n\nwas absent on ${dateLabel}.\n\nSubject: ${subjectName}\nStaff: ${staffName}\n\nRegards,\nCampusFlow`;
  return { sms, email };
};

export const buildMarksTemplates = ({ studentName, classLabel, subjectName, staffName, examType, marks, maxMarks }) => {
  const examLabel = examTypeLabels[examType] || examType;
  const sms = `Dear Parent, ${studentName} scored ${marks}/${maxMarks} in ${examLabel} (${subjectName}).`;
  const email = `Dear Parent,\nYour child ${studentName} (${classLabel})\n\nscored ${marks}/${maxMarks} in ${examLabel}.\n\nSubject: ${subjectName}\nStaff: ${staffName}\n\nRegards,\nCampusFlow`;
  return { sms, email };
};
