 import { Router } from "express";

import {
    createBooking,
    getMyBookings,
    cancelBooking,
} from "../controllers/bookingController.js";

import { protect } from "../middlewares/auth.js";

const bookingRouter = Router();

// Create a new booking
bookingRouter.post("/", protect, createBooking);

// Get logged-in user's bookings
bookingRouter.get("/my", protect, getMyBookings);

// Cancel booking
bookingRouter.delete("/:id", protect, cancelBooking);

export default bookingRouter;