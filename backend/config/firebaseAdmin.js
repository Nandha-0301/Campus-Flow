import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let serviceAccount;
let initialized = false;

if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
  serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  };
} else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  } catch (error) {
    throw new Error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY environment variable. Ensure it is valid JSON.");
  }
} else {
  try {
    const serviceAccountPath = path.resolve(__dirname, "./serviceAccountKey.json");
    const fileContent = fs.readFileSync(serviceAccountPath, "utf8");
    serviceAccount = JSON.parse(fileContent);
  } catch (error) {
    console.warn("Could not load serviceAccountKey.json locally. Ensure FIREBASE_* environment variables are set in production.");
  }
}

const REQUIRED_SERVICE_ACCOUNT_KEYS = ["type", "project_id", "private_key", "client_email"];

const validateServiceAccount = () => {
  if (!serviceAccount) {
    throw new Error("Firebase service account is missing.");
  }
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
