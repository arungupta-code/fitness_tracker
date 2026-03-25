import express from "express";
import {
  UserLogin,
  UserRegister,
  addWorkout,
  createUserBooking,
  getUserBookings,
  getUserDashboard,
  getUserNotifications,
  getWorkoutHistory,
  getWorkoutsByDate,
  markUserNotificationRead,
  userEndSession,
} from "../controllers/User.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.post("/signup", UserRegister);
router.post("/signin", UserLogin);

router.get("/dashboard", verifyToken, getUserDashboard);
router.get("/workout", verifyToken, getWorkoutsByDate);
router.get("/workouts/history", verifyToken, getWorkoutHistory);
router.post("/workout", verifyToken, addWorkout);
router.post("/booking", verifyToken, createUserBooking);
router.post("/bookings/:id/end-session", verifyToken, userEndSession);
router.get("/bookings", verifyToken, getUserBookings);
router.get("/notifications", verifyToken, getUserNotifications);
router.patch("/notifications/:id/read", verifyToken, markUserNotificationRead);

export default router;
