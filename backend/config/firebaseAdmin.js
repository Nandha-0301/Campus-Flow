import admin from "firebase-admin";
import serviceAccount from "./serviceAccountKey.json" with { type: "json" };

let initialized = false;

const REQUIRED_SERVICE_ACCOUNT_KEYS = ["type", "project_id", "private_key", "client_email"];

const validateServiceAccount = () => {
  for (const key of REQUIRED_SERVICE_ACCOUNT_KEYS) {
    if (!serviceAccount?.[key] || typeof serviceAccount[key] !== "string") {
      throw new Error(`Firebase service account is invalid: missing string "${key}"`);
    }
  }
};

const initializeFirebaseAdmin = () => {
  if (initialized || admin.apps.length) {
    initialized = true;
    return admin.app();
  }

  validateServiceAccount();

  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    initialized = true;
    console.log("Firebase Admin Initialized");
    return admin.app();
  } catch (error) {
    const message = error?.message || "Unknown Firebase initialization error";
    throw new Error(`Failed to initialize Firebase Admin SDK: ${message}`);
  }
};

export const verifyFirebaseToken = async (token) => {
  if (!token || typeof token !== "string") {
    throw new Error("Firebase token is required");
  }

  initializeFirebaseAdmin();

  try {
    return await admin.auth().verifyIdToken(token);
  } catch (_error) {
    throw new Error("Invalid Firebase token");
  }
};

export const getFirebaseAuth = () => {
  initializeFirebaseAdmin();
  return admin.auth();
};

export default initializeFirebaseAdmin;
