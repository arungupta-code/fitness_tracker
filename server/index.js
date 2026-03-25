import express from "express";
import * as dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import UserRoutes from "./routes/User.js";
import TrainerRoutes from "./routes/Trainer.js";
import Workout from "./models/Workout.js";

dotenv.config();
const PORT = process.env.PORT || 5000;
const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

/** Respond before DB routes — useful to verify the process is up */
app.get("/api/health", (req, res) => {
  const ready = mongoose.connection.readyState === 1;
  res.status(ready ? 200 : 503).json({
    ok: ready,
    db:
      ready
        ? "connected"
        : ["disconnected", "connected", "connecting", "disconnecting"][
            mongoose.connection.readyState
          ] || "unknown",
  });
});

app.use("/api/user/", UserRoutes);
app.use("/api/trainer/", TrainerRoutes);

app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || "Something went wrong";
  return res.status(status).json({
    success: false,
    status,
    message,
  });
});

app.get("/", async (req, res) => {
  res.status(200).json({
    message: "API is running. Use GET /api/health for database status.",
  });
});

const startServer = async () => {
  if (!process.env.MONGODB_URL) {
    console.error(
      "[server] Missing MONGODB_URL in server/.env — add your MongoDB connection string."
    );
    process.exit(1);
  }
  if (!process.env.JWT) {
    console.error("[server] Missing JWT in server/.env — add a secret string for tokens.");
    process.exit(1);
  }

  mongoose.set("strictQuery", true);

  try {
    await mongoose.connect(process.env.MONGODB_URL, {
      serverSelectionTimeoutMS: 20000,
    });
    console.log("[server] Connected to MongoDB");
    // Backward-compat: older schema created unique index on workoutName.
    // Drop it so adding same workout name on different days/users doesn't crash server.
    try {
      await Workout.collection.dropIndex("workoutName_1");
      console.log("[server] Dropped legacy unique index: workoutName_1");
    } catch (indexErr) {
      // Ignore when index does not exist.
    }
  } catch (err) {
    console.error("[server] MongoDB connection failed:", err.message);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`[server] Listening on http://localhost:${PORT}`);
    console.log(`[server] API base: http://localhost:${PORT}/api/`);
  });
};

startServer();
