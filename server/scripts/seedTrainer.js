/**
 * Inserts one demo trainer so "Book a session" has a selectable trainer.
 * Run from server folder: npm run seed:trainer
 * Login: trainer@demo.com / trainer123
 */
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import Trainer from "../models/Trainer.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const DEMO_EMAIL = "trainer@demo.com";
const DEMO_PASSWORD = "trainer123";

async function main() {
  if (!process.env.MONGODB_URL) {
    console.error("Missing MONGODB_URL in server/.env");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URL, {
    serverSelectionTimeoutMS: 20000,
  });

  const existing = await Trainer.findOne({ email: DEMO_EMAIL });
  if (existing) {
    console.log(`Trainer already exists: ${DEMO_EMAIL} (no changes made).`);
    await mongoose.disconnect();
    return;
  }

  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(DEMO_PASSWORD, salt);

  await Trainer.create({
    name: "Alex Rivera",
    email: DEMO_EMAIL,
    password: hashedPassword,
    specialty: "Strength & HIIT",
    bio: "Demo trainer seeded for local development.",
    yearsExperience: 6,
    phone: "",
    certifications: ["CPT", "CPR"],
  });

  console.log("Seeded trainer:");
  console.log(`  Email:    ${DEMO_EMAIL}`);
  console.log(`  Password: ${DEMO_PASSWORD}`);
  console.log("Use Member → Book a session to see this trainer in the list.");

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
