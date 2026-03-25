import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { createError } from "../error.js";
import Trainer from "../models/Trainer.js";
import Booking from "../models/Booking.js";
import Notification from "../models/Notification.js";
import { notifyUserAboutBooking } from "../utils/notify.js";

export const TrainerRegister = async (req, res, next) => {
  try {
    const {
      email,
      password,
      name,
      img,
      specialty,
      bio,
      yearsExperience,
      phone,
      certifications,
    } = req.body;

    const existing = await Trainer.findOne({ email }).exec();
    if (existing) {
      return next(createError(409, "Email is already in use."));
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const trainer = new Trainer({
      name,
      email,
      password: hashedPassword,
      img,
      specialty,
      bio,
      yearsExperience,
      phone,
      certifications: certifications || [],
    });
    const created = await trainer.save();
    const token = jwt.sign(
      { id: created._id, role: "trainer" },
      process.env.JWT,
      { expiresIn: "9999 years" }
    );
    const obj = created.toObject();
    delete obj.password;
    return res.status(200).json({
      token,
      user: { ...obj, role: "trainer" },
    });
  } catch (error) {
    return next(error);
  }
};

export const TrainerLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const trainer = await Trainer.findOne({ email });
    if (!trainer) {
      return next(createError(404, "Trainer not found"));
    }
    const ok = bcrypt.compareSync(password, trainer.password);
    if (!ok) {
      return next(createError(403, "Incorrect password"));
    }
    const token = jwt.sign(
      { id: trainer._id, role: "trainer" },
      process.env.JWT,
      { expiresIn: "9999 years" }
    );
    const obj = trainer.toObject();
    delete obj.password;
    return res.status(200).json({
      token,
      user: { ...obj, role: "trainer" },
    });
  } catch (error) {
    return next(error);
  }
};

export const listPublicTrainers = async (req, res, next) => {
  try {
    const trainers = await Trainer.find()
      .select("name email specialty yearsExperience img")
      .lean();
    return res.status(200).json({ trainers });
  } catch (error) {
    return next(error);
  }
};

export const getTrainerBookings = async (req, res, next) => {
  try {
    if (req.user?.role !== "trainer") {
      return next(createError(403, "Trainer access only"));
    }
    const filter = { trainer: req.user.id };
    if (req.query.scope === "history") {
      filter.status = { $in: ["completed", "cancelled", "rejected"] };
    } else {
      filter.status = { $in: ["pending", "confirmed"] };
    }
    const bookings = await Booking.find(filter)
      .populate("user", "name email img")
      .sort({ scheduledAt: -1 })
      .lean();
    return res.status(200).json({ bookings });
  } catch (error) {
    return next(error);
  }
};

export const getTrainerNotifications = async (req, res, next) => {
  try {
    if (req.user?.role !== "trainer") {
      return next(createError(403, "Trainer access only"));
    }
    if (req.query.summary === "1") {
      const unreadCount = await Notification.countDocuments({
        trainer: req.user.id,
        read: false,
      });
      return res.status(200).json({ unreadCount });
    }
    const notifications = await Notification.find({ trainer: req.user.id })
      .populate({
        path: "booking",
        populate: { path: "user", select: "name email" },
      })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    const unreadCount = await Notification.countDocuments({
      trainer: req.user.id,
      read: false,
    });
    return res.status(200).json({ notifications, unreadCount });
  } catch (error) {
    return next(error);
  }
};

export const markTrainerNotificationRead = async (req, res, next) => {
  try {
    if (req.user?.role !== "trainer") {
      return next(createError(403, "Trainer access only"));
    }
    const n = await Notification.findOne({
      _id: req.params.id,
      trainer: req.user.id,
    });
    if (!n) return next(createError(404, "Notification not found"));
    n.read = true;
    await n.save();
    return res.status(200).json({ notification: n });
  } catch (error) {
    return next(error);
  }
};

export const acceptTrainerBooking = async (req, res, next) => {
  try {
    if (req.user?.role !== "trainer") {
      return next(createError(403, "Trainer access only"));
    }
    const booking = await Booking.findById(req.params.id);
    if (!booking || String(booking.trainer) !== String(req.user.id)) {
      return next(createError(404, "Booking not found"));
    }
    if (booking.status !== "pending") {
      return next(createError(400, "Only pending requests can be accepted"));
    }
    booking.status = "confirmed";
    await booking.save();
    await Notification.updateMany(
      {
        booking: booking._id,
        trainer: req.user.id,
        type: "NEW_BOOKING_REQUEST",
      },
      { read: true }
    );
    await notifyUserAboutBooking({
      userId: booking.user,
      bookingId: booking._id,
      type: "BOOKING_ACCEPTED",
      title: "Session confirmed",
      body: "Your trainer accepted this session.",
    });
    return res.status(200).json({ booking });
  } catch (error) {
    return next(error);
  }
};

export const rejectTrainerBooking = async (req, res, next) => {
  try {
    if (req.user?.role !== "trainer") {
      return next(createError(403, "Trainer access only"));
    }
    const booking = await Booking.findById(req.params.id);
    if (!booking || String(booking.trainer) !== String(req.user.id)) {
      return next(createError(404, "Booking not found"));
    }
    if (booking.status !== "pending") {
      return next(createError(400, "Only pending requests can be rejected"));
    }
    booking.status = "rejected";
    await booking.save();
    await Notification.updateMany(
      {
        booking: booking._id,
        trainer: req.user.id,
        type: "NEW_BOOKING_REQUEST",
      },
      { read: true }
    );
    await notifyUserAboutBooking({
      userId: booking.user,
      bookingId: booking._id,
      type: "BOOKING_REJECTED",
      title: "Session declined",
      body: "Your trainer declined this session request.",
    });
    return res.status(200).json({ booking });
  } catch (error) {
    return next(error);
  }
};

export const trainerEndSession = async (req, res, next) => {
  try {
    if (req.user?.role !== "trainer") {
      return next(createError(403, "Trainer access only"));
    }
    const booking = await Booking.findById(req.params.id);
    if (!booking || String(booking.trainer) !== String(req.user.id)) {
      return next(createError(404, "Booking not found"));
    }
    if (booking.status !== "confirmed") {
      return next(createError(400, "Only a confirmed session can be ended"));
    }
    booking.status = "completed";
    booking.completedAt = new Date();
    booking.endedBy = "trainer";
    await booking.save();
    await notifyUserAboutBooking({
      userId: booking.user,
      bookingId: booking._id,
      type: "SESSION_ENDED",
      title: "Session completed",
      body: "Your trainer marked this session as complete. You can review it in History.",
    });
    return res.status(200).json({ booking });
  } catch (error) {
    return next(error);
  }
};
