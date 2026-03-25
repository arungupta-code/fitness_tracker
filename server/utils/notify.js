import Notification from "../models/Notification.js";

export function notifyNewBookingForTrainer({
  trainerId,
  bookingId,
  memberName,
}) {
  return Notification.create({
    trainer: trainerId,
    booking: bookingId,
    type: "NEW_BOOKING_REQUEST",
    title: "New session request",
    body: `${memberName} requested a training session.`,
  });
}

export function notifyUserAboutBooking({
  userId,
  bookingId,
  type,
  title,
  body,
}) {
  return Notification.create({
    user: userId,
    booking: bookingId,
    type,
    title,
    body: body || "",
  });
}

export function notifyTrainerAboutBooking({
  trainerId,
  bookingId,
  type,
  title,
  body,
}) {
  return Notification.create({
    trainer: trainerId,
    booking: bookingId,
    type,
    title,
    body: body || "",
  });
}
