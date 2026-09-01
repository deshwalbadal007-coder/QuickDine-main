 import { Request, Response } from "express";
import { Restaurant } from "../models/Restaurant.js";
import { booking } from "../models/booking.js";
export const getRestaurant = async (
    req: Request,
    res: Response
): Promise<Response> => {
    try {
        const { search, priceRange, rating, location, sort } = req.query;

        const queryObject: any = {
            status: "approved",
        };

        // Search by name, location, or tags
        if (search) {
            queryObject.$or = [
                {
                    name: {
                        $regex: search as string,
                        $options: "i",
                    },
                },
                {
                    location: {
                        $regex: search as string,
                        $options: "i",
                    },
                },
                {
                    tags: {
                        $regex: search as string,
                        $options: "i",
                    },
                },
            ];
        }

        // Filter by price range
        if (priceRange) {
            const price = Array.isArray(priceRange)
                ? priceRange
                : [priceRange];

            queryObject.priceRange = {
                $in: price,
            };
        }

        // Filter by minimum rating
        if (rating) {
            queryObject.rating = {
                $gte: parseFloat(rating as string),
            };
        }

        // Filter by location
        if (location) {
            queryObject.location = {
                $regex: location as string,
                $options: "i",
            };
        }

        // Sorting
        let sortOption: any = {
            createdAt: -1,
        };

        if (sort === "rating") {
            sortOption = {
                rating: -1,
            };
        } else if (sort === "priceLowToHigh") {
            sortOption = {
                priceRange: 1,
            };
        } else if (sort === "priceHighToLow") {
            sortOption = {
                priceRange: -1,
            };
        } else if (sort === "newest") {
            sortOption = {
                createdAt: -1,
            };
        }

        // Get restaurants
        const restaurants = await Restaurant.find(queryObject)
            .sort(sortOption);

        return res.status(200).json({
            success: true,
            count: restaurants.length,
            restaurants,
        });
    } catch (error: any) {
        console.error("Get Restaurant Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

export const getFeaturedRestaurant = async (
    req: Request,
    res: Response
): Promise<Response> => {
    try {
        const restaurants = await Restaurant.find({
            status: "approved",
            $or: [
                { featured: true },
                { exclusive: true },
            ],
        }).limit(6);

        return res.status(200).json({
            success: true,
            count: restaurants.length,
            restaurants,
        });
    } catch (error: any) {
        console.error("Get Featured Restaurant Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

export const getRestaurantBySlug = async (
    req: Request,
    res: Response
): Promise<Response> => {
    try {
        const { slug } = req.params;

        const restaurant = await Restaurant.findOne({
            slug,
            status: "approved",
        });

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: "Restaurant not found",
            });
        }

        return res.status(200).json({
            success: true,
            restaurant,
        });
    } catch (error: any) {
        console.error("Get Restaurant By Slug Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

export const getRestaurantAvailability = async (
    req: Request,
    res: Response
): Promise<Response> => {
    try {
        const { id } = req.params;
        const { date, guests } = req.query;

        if (!id || !date || !guests) {
            return res.status(400).json({
                success: false,
                message: "Restaurant ID, date and guests are required",
            });
        }

        const restaurant = await Restaurant.findById(id);

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: "Restaurant not found",
            });
        }

        const requestedGuests = Number(guests);

        if (!Number.isInteger(requestedGuests) || requestedGuests <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid number of guests",
            });
        }

        // Normalize selected date
        const startOfDay = new Date(`${date}T00:00:00`);
        const endOfDay = new Date(`${date}T23:59:59.999`);

        // Use restaurant slots if available
        const timeSlots =
            restaurant.availableSlots?.length
                ? restaurant.availableSlots
                : [
                      "12:00",
                      "12:30",
                      "13:00",
                      "13:30",
                      "19:00",
                      "19:30",
                      "20:00",
                      "20:30",
                      "21:00",
                      "21:30",
                  ];

        const totalSeats = restaurant.totalSeats || 20;

        const availability = [];

        for (const time of timeSlots) {
            const existingBookings = await booking.find({
                restaurant: id,
                date: {
                    $gte: startOfDay,
                    $lte: endOfDay,
                },
                time: time,
                status: "confirmed",
            });

            const bookedSeats = existingBookings.reduce(
                (total, currentBooking) => {
                    return total + currentBooking.guests;
                },
                0
            );

            const availableSeats = Math.max(
                totalSeats - bookedSeats,
                0
            );

            availability.push({
                time,
                availableSeats,
                isAvailable: availableSeats >= requestedGuests,
            });
        }

        return res.status(200).json({
            success: true,
            availability,
        });
    } catch (error: any) {
        console.error("Availability error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};