 import { Request,Response } from "express";
import { AuthRequest } from "../middlewares/auth.js";
import { Restaurant } from "../models/Restaurant.js";
import { booking } from "../models/booking.js";

// =========================
// Create Booking
// =========================
export const createBooking = async (
    req: AuthRequest,
    res: Response
): Promise<Response> => {
    try {
        const {
            restaurantId,
            date,
            time,
            guests,
            occasion,
            specialRequests,
        } = req.body;

        // Check authentication
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Not authorized",
            });
        }

        // Check required fields
        if (!restaurantId || !date || !time || !guests) {
            return res.status(400).json({
                success: false,
                message: "Please provide restaurantId, date, time and guests",
            });
        }

        // Validate date
        const bookingDate = new Date(date);

        if (isNaN(bookingDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Invalid booking date",
            });
        }

        // Validate guests
        const requestedGuests = Number(guests);

        if (
            !Number.isInteger(requestedGuests) ||
            requestedGuests <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Guests must be a valid positive number",
            });
        }

        // Find restaurant
        const restaurant = await Restaurant.findById(restaurantId);

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: "Restaurant not found",
            });
        }

        // Check restaurant status
        if (restaurant.status !== "approved") {
            return res.status(400).json({
                success: false,
                message: "Restaurant is not approved for booking",
            });
        }
        // Restaurant total seats
        const totalSeats = restaurant.totalSeats || 20;

        // Find confirmed bookings for same restaurant,
        // date and time
        const existingBookings = await booking.find({
            restaurant: restaurantId,
            date: bookingDate,
            time: time,
            status: "confirmed",
        });

        // Calculate already booked seats
        const bookedSeats = existingBookings.reduce(
            (total, currentBooking) => {
                return total + currentBooking.guests;
            },
            0
        );

        // Calculate available seats
        const availableSeats = totalSeats - bookedSeats;

        // Check availability
        if (requestedGuests > availableSeats) {
            return res.status(400).json({
                success: false,
                message: `Not enough available seats. Only ${availableSeats} seats are available.`,
            });
        }

        // Create booking
        const newBooking = await booking.create({
            user: req.user._id,
            restaurant: restaurantId,
            date: bookingDate,
            time,
            guests: requestedGuests,
            occasion,
            specialRequests,
            status: "confirmed",
        });

        // Populate restaurant information
        const populatedBooking = await newBooking.populate(
            "restaurant",
            "name location image address"
        );

        return res.status(201).json({
            success: true,
            message: "Booking created successfully",
            booking: populatedBooking,
        });
    } catch (error: any) {
        console.error("Create booking error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// =========================
// Get My Bookings
// =========================
export const getMyBookings = async (
    req: AuthRequest,
    res: Response
): Promise<Response> => {
    try {
        // Check authentication
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Not authorized",
            });
        }

        // Get user's bookings
        const bookings = await booking
            .find({
                user: req.user._id,
            })
            .populate(
                "restaurant",
                "name slug cuisine location image address"

            )
            .sort({
                createdAt: -1,
            });

        return res.status(200).json({
            success: true,
            count: bookings.length,
            bookings,
        });
    } catch (error: any) {
        console.error("Get my bookings error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// =========================
// Cancel Booking
// =========================
export const cancelBooking = async (
    req: AuthRequest,
    res: Response
): Promise<Response> => {
    try {
        // Check authentication
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Not authorized",
            });
        }

        const { id } = req.params;

        // Check booking ID
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Booking ID is required",
            });
        }

        // Find booking
        const existingBooking = await booking.findById(id);

        if (!existingBooking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found",
            });
        }

        // Check booking ownership
        if (
            existingBooking.user.toString() !==
            req.user._id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: "You are not the owner of this booking",
            });
        }

        // Check if already cancelled
        if (existingBooking.status === "cancelled") {
            return res.status(400).json({
                success: false,
                message: "Booking is already cancelled",
            });
        }

        // Check if booking is completed
        if (existingBooking.status === "completed") {
            return res.status(400).json({
                success: false,
                message: "Completed booking cannot be cancelled",
            });
        }

        // Cancel booking
        existingBooking.status = "cancelled";

        await existingBooking.save();

        // Populate restaurant information
        const populatedBooking = await existingBooking.populate(
            "restaurant",
                        "name slug cuisine location image address"

        );

        return res.status(200).json({
            success: true,
            message: "Booking cancelled successfully",
            booking: populatedBooking,
        });
    } catch (error: any) {
        console.error("Cancel booking error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};