import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { createError } from "../error.js";
import mongoose from "mongoose";
import User from "../models/User.js";
import Workout from "../models/Workout.js";
import Booking from "../models/Booking.js";
import Trainer from "../models/Trainer.js";
import Notification from "../models/Notification.js";
import {
  notifyNewBookingForTrainer,
  notifyTrainerAboutBooking,
} from "../utils/notify.js";

dotenv.config();

export const UserRegister = async (req, res, next) => {
  try {
    const { email, password, name, img } = req.body;

    // Check if the email is in use
    const existingUser = await User.findOne({ email }).exec();
    if (existingUser) {
      return next(createError(409, "Email is already in use."));
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      img,
    });
    const createdUser = await user.save();
    const token = jwt.sign(
      { id: createdUser._id, role: "user" },
      process.env.JWT,
      {
        expiresIn: "9999 years",
      }
    );
    const userObj = createdUser.toObject();
    delete userObj.password;
    return res
      .status(200)
      .json({ token, user: { ...userObj, role: "user" } });
  } catch (error) {
    return next(error);
  }
};

export const UserLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email });
    // Check if user exists
    if (!user) {
      return next(createError(404, "User not found"));
    }
    console.log(user);
    // Check if password is correct
    const isPasswordCorrect = await bcrypt.compareSync(password, user.password);
    if (!isPasswordCorrect) {
      return next(createError(403, "Incorrect password"));
    }

    const token = jwt.sign({ id: user._id, role: "user" }, process.env.JWT, {
      expiresIn: "9999 years",
    });

    const userObj = user.toObject();
    delete userObj.password;
    return res.status(200).json({ token, user: { ...userObj, role: "user" } });
  } catch (error) {
    return next(error);
  }
};

export const getUserDashboard = async (req, res, next) => {
  try {
    if (req.user?.role === "trainer") {
      return next(createError(403, "Dashboard is for members only."));
    }
    const userId = req.user?.id;
    const user = await User.findById(userId);
    if (!user) {
      return next(createError(404, "User not found"));
    }

    const currentDateFormatted = new Date();
    const startToday = new Date(
      currentDateFormatted.getFullYear(),
      currentDateFormatted.getMonth(),
      currentDateFormatted.getDate()
    );
    const endToday = new Date(
      currentDateFormatted.getFullYear(),
      currentDateFormatted.getMonth(),
      currentDateFormatted.getDate() + 1
    );

    //calculte total calories burnt
    const totalCaloriesBurnt = await Workout.aggregate([
      { $match: { user: user._id, date: { $gte: startToday, $lt: endToday } } },
      {
        $group: {
          _id: null,
          totalCaloriesBurnt: { $sum: "$caloriesBurned" },
        },
      },
    ]);

    //Calculate total no of workouts
    const totalWorkouts = await Workout.countDocuments({
      user: userId,
      date: { $gte: startToday, $lt: endToday },
    });

    //Calculate average calories burnt per workout
    const avgCaloriesBurntPerWorkout =
      totalCaloriesBurnt.length > 0
        ? totalCaloriesBurnt[0].totalCaloriesBurnt / totalWorkouts
        : 0;

    // Fetch category of workouts
    const categoryCalories = await Workout.aggregate([
      { $match: { user: user._id, date: { $gte: startToday, $lt: endToday } } },
      {
        $group: {
          _id: "$category",
          totalCaloriesBurnt: { $sum: "$caloriesBurned" },
        },
      },
    ]);

    //Format category data for pie chart

    const pieChartData = categoryCalories.map((category, index) => ({
      id: index,
      value: category.totalCaloriesBurnt,
      label: category._id,
    }));

    const weeks = [];
    const caloriesBurnt = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(
        currentDateFormatted.getTime() - i * 24 * 60 * 60 * 1000
      );
      weeks.push(
        date.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        })
      );

      const startOfDay = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      );
      const endOfDay = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate() + 1
      );

      const weekData = await Workout.aggregate([
        {
          $match: {
            user: user._id,
            date: { $gte: startOfDay, $lt: endOfDay },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            totalCaloriesBurnt: { $sum: "$caloriesBurned" },
          },
        },
        {
          $sort: { _id: 1 }, // Sort by date in ascending order
        },
      ]);

      caloriesBurnt.push(
        weekData[0]?.totalCaloriesBurnt ? weekData[0]?.totalCaloriesBurnt : 0
      );
    }

    return res.status(200).json({
      totalCaloriesBurnt:
        totalCaloriesBurnt.length > 0
          ? totalCaloriesBurnt[0].totalCaloriesBurnt
          : 0,
      totalWorkouts: totalWorkouts,
      avgCaloriesBurntPerWorkout: avgCaloriesBurntPerWorkout,
      totalWeeksCaloriesBurnt: {
        weeks: weeks,
        caloriesBurned: caloriesBurnt,
      },
      pieChartData: pieChartData,
    });
  } catch (err) {
    next(err);
  }
};

export const getWorkoutsByDate = async (req, res, next) => {
  try {
    if (req.user?.role === "trainer") {
      return next(createError(403, "Workouts are for members only."));
    }
    const userId = req.user?.id;
    const user = await User.findById(userId);
    let date = req.query.date ? new Date(req.query.date) : new Date();
    if (!user) {
      return next(createError(404, "User not found"));
    }
    const startOfDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    const endOfDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate() + 1
    );

    const todaysWorkouts = await Workout.find({
      user: userId,
      date: { $gte: startOfDay, $lt: endOfDay },
    });
    const totalCaloriesBurnt = todaysWorkouts.reduce(
      (total, workout) => total + workout.caloriesBurned,
      0
    );

    return res.status(200).json({ todaysWorkouts, totalCaloriesBurnt });
  } catch (err) {
    next(err);
  }
};

export const addWorkout = async (req, res, next) => {
  try {
    if (req.user?.role === "trainer") {
      return next(createError(403, "Only members can log workouts."));
    }
    const userId = req.user?.id;
    const { workoutString } = req.body;
    if (!workoutString) {
      return next(createError(400, "Workout string is missing"));
    }
    // Split workoutString into lines
    const eachworkout = workoutString.split(";").map((line) => line.trim());
    // Check if any workouts start with "#" to indicate categories
    const categories = eachworkout.filter((line) => line.startsWith("#"));
    if (categories.length === 0) {
      return next(createError(400, "No categories found in workout string"));
    }

    const parsedWorkouts = [];
    let currentCategory = "";
    let count = 0;

    // Loop through each line to parse workout details
    for (const line of eachworkout) {
      count++;
      if (line.startsWith("#")) {
        const parts = line?.split("\n").map((part) => part.trim());
        console.log(parts);
        if (parts.length < 5) {
          return next(createError(400, `Workout string is missing for ${count}th workout`));
        }

        // Update current category
        currentCategory = parts[0].substring(1).trim();
        // Extract workout details
        const workoutDetails = parseWorkoutLine(parts);
        if (workoutDetails == null) {
          return next(createError(400, "Please enter in proper format "));
        }

        if (workoutDetails) {
          // Add category to workout details
          workoutDetails.category = currentCategory;
          parsedWorkouts.push(workoutDetails);
        }
      } else {
        return next(createError(400, `Workout string is missing for ${count}th workout`));
      }
    }

    // Calculate calories and insert all workouts in one awaited operation.
    const workoutsToInsert = parsedWorkouts.map((workout) => ({
      ...workout,
      caloriesBurned: parseFloat(calculateCaloriesBurnt(workout)),
      user: userId,
    }));
    await Workout.insertMany(workoutsToInsert, { ordered: true });

    return res.status(201).json({
      message: "Workouts added successfully",
      workouts: parsedWorkouts,
    });
  } catch (err) {
    if (err?.code === 11000) {
      return next(
        createError(
          409,
          "Duplicate workout name found. Use a different workout name or edit the existing workout."
        )
      );
    }
    next(err);
  }
};

export const getWorkoutHistory = async (req, res, next) => {
  try {
    if (req.user?.role === "trainer") {
      return next(createError(403, "Members only."));
    }
    const userId = req.user?.id;
    const user = await User.findById(userId);
    if (!user) {
      return next(createError(404, "User not found"));
    }
    const workouts = await Workout.find({ user: userId })
      .sort({ date: -1 })
      .limit(300)
      .lean();
    return res.status(200).json({ workouts });
  } catch (err) {
    next(err);
  }
};

export const createUserBooking = async (req, res, next) => {
  try {
    if (req.user?.role === "trainer") {
      return next(createError(403, "Members book sessions."));
    }
    const userId = req.user?.id;
    const { scheduledAt, notes, trainerId } = req.body;
    if (!scheduledAt) {
      return next(createError(400, "scheduledAt is required"));
    }
    if (!trainerId || !mongoose.isValidObjectId(trainerId)) {
      return next(
        createError(400, "Please select a trainer so they can accept your booking.")
      );
    }
    const trainer = await Trainer.findById(trainerId);
    if (!trainer) {
      return next(createError(404, "Trainer not found"));
    }
    const member = await User.findById(userId);
    const booking = await Booking.create({
      user: userId,
      trainer: trainerId,
      scheduledAt: new Date(scheduledAt),
      notes: notes || "",
      status: "pending",
    });
    await notifyNewBookingForTrainer({
      trainerId,
      bookingId: booking._id,
      memberName: member?.name || "A member",
    });
    return res.status(201).json({ booking });
  } catch (err) {
    next(err);
  }
};

export const getUserBookings = async (req, res, next) => {
  try {
    if (req.user?.role === "trainer") {
      return next(createError(403, "Use the trainer portal for your schedule."));
    }
    const userId = req.user?.id;
    const filter = { user: userId };
    if (req.query.scope === "history") {
      filter.status = { $in: ["completed", "cancelled", "rejected"] };
    } else {
      filter.status = { $in: ["pending", "confirmed"] };
    }
    const bookings = await Booking.find(filter)
      .populate("trainer", "name email specialty img")
      .sort({ scheduledAt: -1 })
      .lean();
    return res.status(200).json({ bookings });
  } catch (err) {
    next(err);
  }
};

export const getUserNotifications = async (req, res, next) => {
  try {
    if (req.user?.role === "trainer") {
      return next(createError(403, "Members only."));
    }
    const userId = req.user?.id;
    if (req.query.summary === "1") {
      const unreadCount = await Notification.countDocuments({
        user: userId,
        read: false,
      });
      return res.status(200).json({ unreadCount });
    }
    const notifications = await Notification.find({ user: userId })
      .populate({ path: "booking", populate: { path: "trainer", select: "name email" } })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    const unreadCount = await Notification.countDocuments({
      user: userId,
      read: false,
    });
    return res.status(200).json({ notifications, unreadCount });
  } catch (err) {
    next(err);
  }
};

export const markUserNotificationRead = async (req, res, next) => {
  try {
    if (req.user?.role === "trainer") {
      return next(createError(403, "Members only."));
    }
    const userId = req.user?.id;
    const n = await Notification.findOne({
      _id: req.params.id,
      user: userId,
    });
    if (!n) return next(createError(404, "Notification not found"));
    n.read = true;
    await n.save();
    return res.status(200).json({ notification: n });
  } catch (err) {
    next(err);
  }
};

export const userEndSession = async (req, res, next) => {
  try {
    if (req.user?.role === "trainer") {
      return next(createError(403, "Use trainer end-session."));
    }
    const userId = req.user?.id;
    const booking = await Booking.findById(req.params.id);
    if (!booking || String(booking.user) !== String(userId)) {
      return next(createError(404, "Booking not found"));
    }
    if (booking.status !== "confirmed") {
      return next(createError(400, "Only a confirmed session can be ended"));
    }
    booking.status = "completed";
    booking.completedAt = new Date();
    booking.endedBy = "user";
    await booking.save();
    await notifyTrainerAboutBooking({
      trainerId: booking.trainer,
      bookingId: booking._id,
      type: "SESSION_ENDED",
      title: "Session ended",
      body: "The member marked this session as complete. It has been moved to history.",
    });
    return res.status(200).json({ booking });
  } catch (err) {
    next(err);
  }
};

// Function to parse workout details from a line
const parseWorkoutLine = (parts) => {
  const details = {};
  console.log(parts);
  if (parts.length >= 5) {
    details.workoutName = parts[1].substring(1).trim();
    details.sets = parseInt(parts[2].split("sets")[0].substring(1).trim());
    details.reps = parseInt(
      parts[2].split("sets")[1].split("reps")[0].substring(1).trim()
    );
    details.weight = parseFloat(parts[3].split("kg")[0].substring(1).trim());
    details.duration = parseFloat(parts[4].split("min")[0].substring(1).trim());
    console.log(details);
    return details;
  }
  return null;
};

// Function to calculate calories burnt for a workout
const calculateCaloriesBurnt = (workoutDetails) => {
  const durationInMinutes = parseInt(workoutDetails.duration);
  const weightInKg = parseInt(workoutDetails.weight);
  const caloriesBurntPerMinute = 5; // Sample value, actual calculation may vary
  return durationInMinutes * caloriesBurntPerMinute * weightInKg;
};
