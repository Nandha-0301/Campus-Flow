import admin from "firebase-admin";

let initialized = false;
const REQUIRED_FIREBASE_ENV_VARS = [
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
];

const normalizePrivateKey = (privateKey) => {
  if (typeof privateKey !== "string") {
    return privateKey;
  }

  let normalized = privateKey.trim();

  if (
    (normalized.startsWith('"') && normalized.endsWith('"')) ||
    (normalized.startsWith("'") && normalized.endsWith("'"))
  ) {
    normalized = normalized.slice(1, -1);
  }

  return normalized.replace(/\\n/g, "\n");
};

const decodeJwtPayload = (token) => {
  if (typeof token !== "string") {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    return JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
  } catch {
    return null;
  }
};

const buildServiceAccountFromEnv = () => ({
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  private_key: normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY),
});

const validateFirebaseEnv = () => {
  const missingVars = REQUIRED_FIREBASE_ENV_VARS.filter((key) => {
    const value = process.env[key];
    return typeof value !== "string" || value.trim() === "";
  });

  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();

  console.log(projectId ? "Firebase startup: FIREBASE_PROJECT_ID loaded" : "Firebase startup: FIREBASE_PROJECT_ID missing");
  console.log(
    clientEmail ? "Firebase startup: FIREBASE_CLIENT_EMAIL loaded" : "Firebase startup: FIREBASE_CLIENT_EMAIL missing"
  );
  console.log(
    process.env.FIREBASE_PRIVATE_KEY
      ? "Firebase startup: FIREBASE_PRIVATE_KEY detected"
      : "Firebase startup: FIREBASE_PRIVATE_KEY missing"
  );

  if (projectId) {
    console.log(`Firebase startup: Admin SDK projectId=${projectId}`);
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    console.warn("Firebase startup: FIREBASE_SERVICE_ACCOUNT_KEY is set but ignored. Remove it to avoid config drift.");
  }

  if (missingVars.length > 0) {
    throw new Error(`Firebase configuration is incomplete. Missing: ${missingVars.join(", ")}`);
  }

  const expectedEmailSuffix = `@${projectId}.iam.gserviceaccount.com`;
  if (clientEmail && !clientEmail.endsWith(expectedEmailSuffix)) {
    console.warn(
      `Firebase startup: FIREBASE_CLIENT_EMAIL does not match FIREBASE_PROJECT_ID (expected suffix ${expectedEmailSuffix})`
    );
  }

  const normalizedPrivateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

  if (!normalizedPrivateKey.includes("BEGIN PRIVATE KEY") || !normalizedPrivateKey.includes("END PRIVATE KEY")) {
    console.error("Firebase startup: FIREBASE_PRIVATE_KEY malformed");
    throw new Error('Firebase service account is invalid: "private_key" is not a valid PEM block');
  }

  console.log("Firebase startup: FIREBASE_PRIVATE_KEY format looks valid");
};

const initializeFirebaseAdmin = () => {
  if (initialized || admin.apps.length) {
    initialized = true;
    return admin.app();
  }

  validateFirebaseEnv();
  const serviceAccount = buildServiceAccountFromEnv();

  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
    initialized = true;
    console.log("Firebase Admin Initialized");
    return admin.app();
  } catch (error) {
    const message = error?.message || "Unknown Firebase initialization error";
    throw new Error(`Failed to initialize Firebase Admin SDK: ${message}`);
  }
};

export const getConfiguredFirebaseProjectId = () => process.env.FIREBASE_PROJECT_ID?.trim() || null;

export const verifyFirebaseToken = async (token) => {
  if (!token || typeof token !== "string") {
    throw new Error("Firebase token is required");
  }

  initializeFirebaseAdmin();

  const tokenPayload = decodeJwtPayload(token);
  const expectedProjectId = getConfiguredFirebaseProjectId();

  if (tokenPayload?.aud && expectedProjectId && tokenPayload.aud !== expectedProjectId) {
    console.error("Firebase token project mismatch before verifyIdToken", {
      tokenAud: tokenPayload.aud,
      expectedProjectId,
      tokenIss: tokenPayload.iss || null,
    });
  }

  try {
    return await admin.auth().verifyIdToken(token);
  } catch (error) {
    console.error("Firebase verifyIdToken failed", {
      code: error?.code || "unknown",
      message: error?.message || "verifyIdToken failed",
      tokenAud: tokenPayload?.aud || null,
      expectedProjectId,
      tokenIss: tokenPayload?.iss || null,
    });
    const verificationError = new Error(error?.message || "Invalid Firebase token");
    verificationError.code = error?.code || "auth/invalid-token";
    throw verificationError;
  }
};

export const getFirebaseAuth = () => {
  initializeFirebaseAdmin();
  return admin.auth();
};

export default initializeFirebaseAdmin;
