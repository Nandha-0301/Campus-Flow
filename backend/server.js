import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { connectDB } from "./config/db.js";
import initializeFirebaseAdmin from "./config/firebaseAdmin.js";
import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import commonRoutes from "./routes/commonRoutes.js";
import parentRoutes from "./routes/parentRoutes.js";
import staffRoutes from "./routes/staffRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import { sendError, sendSuccess } from "./utils/response.js";

dotenv.config({ override: true });

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  ...(process.env.CLIENT_ORIGIN ? [process.env.CLIENT_ORIGIN] : []),
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(express.json());

app.get("/health", (_req, res) => sendSuccess(res, { service: "CampusFlow API" }, "Healthy"));

app.use("/api/auth", authRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", commonRoutes);
app.use("/api/parent", parentRoutes);

app.use((error, _req, res, _next) => {
  console.error(error);
  return sendError(res, "Server Error", 500, [error.message]);
});

const PORT = process.env.PORT || 5000;

const startServer = () =>
  new Promise((resolve, reject) => {
    const server = app.listen(PORT, () => {
      console.log(`CampusFlow API running on port ${PORT}`);
      resolve(server);
    });

    server.on("error", (error) => {
      if (error?.code === "EADDRINUSE") {
        reject(new Error(`Port ${PORT} is already in use. Update PORT in .env or stop the existing process.`));
        return;
      }
      reject(error);
    });
  });

const bootstrap = async () => {
  try {
    initializeFirebaseAdmin();
    await connectDB();
    await startServer();
  } catch (error) {
    console.error("Server bootstrap failed:", error?.message || error);
    process.exit(1);
  }
};

bootstrap();

