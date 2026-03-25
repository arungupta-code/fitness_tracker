import mongoose from "mongoose";

const TrainerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    img: {
      type: String,
      default: null,
    },
    password: {
      type: String,
      required: true,
    },
    specialty: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "",
    },
    yearsExperience: {
      type: Number,
      default: 0,
    },
    phone: {
      type: String,
      default: "",
    },
    certifications: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.model("Trainer", TrainerSchema);
