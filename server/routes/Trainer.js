import express from "express";
import {
  TrainerLogin,
  TrainerRegister,
  acceptTrainerBooking,
  getTrainerBookings,
  getTrainerNotifications,
  listPublicTrainers,
  markTrainerNotificationRead,
  rejectTrainerBooking,
  trainerEndSession,
} from "../controllers/Trainer.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.post("/signup", TrainerRegister);
router.post("/signin", TrainerLogin);
router.get("/public", listPublicTrainers);
router.get("/notifications", verifyToken, getTrainerNotifications);
router.patch("/notifications/:id/read", verifyToken, markTrainerNotificationRead);
router.post("/bookings/:id/accept", verifyToken, acceptTrainerBooking);
router.post("/bookings/:id/reject", verifyToken, rejectTrainerBooking);
router.post("/bookings/:id/end-session", verifyToken, trainerEndSession);
router.get("/bookings", verifyToken, getTrainerBookings);

export default router;
