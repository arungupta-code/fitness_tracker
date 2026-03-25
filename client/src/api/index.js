import axios from "axios";

/**
 * In development, ALWAYS use "/api/" (same origin as the React dev server, e.g. :3000).
 * CRA "proxy" in package.json forwards /api → http://localhost:5000.
 *
 * Do NOT put REACT_APP_API_URL=http://localhost:5000/... in .env — it gets baked into
 * the bundle and forces the browser to call :5000 directly (connection refused if API
 * is down). Windows env vars can also set REACT_APP_*; we ignore REACT_APP_API_URL in dev.
 *
 * To hit a remote API while npm start: set REACT_APP_DEV_REMOTE_API=https://... in .env.development
 */
const baseURL =
  process.env.NODE_ENV === "development"
    ? process.env.REACT_APP_DEV_REMOTE_API || "/api/"
    : process.env.REACT_APP_API_URL ||
      "https://fitnesstrack-vtv1.onrender.com/api/";

const API = axios.create({
  baseURL,
  /** Signup/login can wait on MongoDB + bcrypt; short timeouts caused 504 via proxy */
  timeout: 120000,
});

export const UserSignUp = async (data) => API.post("/user/signup", data);
export const UserSignIn = async (data) => API.post("/user/signin", data);
export const TrainerSignUp = async (data) => API.post("/trainer/signup", data);
export const TrainerSignIn = async (data) => API.post("/trainer/signin", data);

export const listPublicTrainers = async () => API.get("/trainer/public");

export const getDashboardDetails = async (token) =>
  API.get("/user/dashboard", {
    headers: { Authorization: `Bearer ${token}` },
  });

export const getWorkouts = async (token, date) =>
  API.get(`/user/workout${date}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const getWorkoutHistory = async (token) =>
  API.get("/user/workouts/history", {
    headers: { Authorization: `Bearer ${token}` },
  });

export const addWorkout = async (token, data) =>
  API.post(`/user/workout`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const createBooking = async (token, data) =>
  API.post(`/user/booking`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const getUserBookings = async (token, scope = "active") =>
  API.get(`/user/bookings`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { scope },
  });

export const getTrainerBookings = async (token, scope = "active") =>
  API.get(`/trainer/bookings`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { scope },
  });

export const getUserNotifications = async (token, summaryOnly = false) =>
  API.get(`/user/notifications`, {
    headers: { Authorization: `Bearer ${token}` },
    params: summaryOnly ? { summary: 1 } : {},
  });

export const getTrainerNotifications = async (token, summaryOnly = false) =>
  API.get(`/trainer/notifications`, {
    headers: { Authorization: `Bearer ${token}` },
    params: summaryOnly ? { summary: 1 } : {},
  });

export const markUserNotificationRead = async (token, id) =>
  API.patch(`/user/notifications/${id}/read`, null, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const markTrainerNotificationRead = async (token, id) =>
  API.patch(`/trainer/notifications/${id}/read`, null, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const acceptTrainerBooking = async (token, bookingId) =>
  API.post(
    `/trainer/bookings/${bookingId}/accept`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );

export const rejectTrainerBooking = async (token, bookingId) =>
  API.post(
    `/trainer/bookings/${bookingId}/reject`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );

export const trainerEndSession = async (token, bookingId) =>
  API.post(
    `/trainer/bookings/${bookingId}/end-session`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );

export const userEndSession = async (token, bookingId) =>
  API.post(
    `/user/bookings/${bookingId}/end-session`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
