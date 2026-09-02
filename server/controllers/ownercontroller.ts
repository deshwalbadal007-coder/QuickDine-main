import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.js";
import { Restaurant } from "../models/Restaurant.js";
import { booking } from "../models/booking.js";
import { v2 as Cloudinary } from "cloudinary";
import { Readable } from "stream";


// Upload image to Cloudinary
const uploadToCloudinary = (
    fileBuffer: Buffer
): Promise<{ secure_url: string }> => {
    return new Promise((resolve, reject) => {
        const stream = Cloudinary.uploader.upload_stream(
            {
                folder: "QuickDine-main",
            },
            (error, result) => {
                if (error) {
                    return reject(error);
                }

                if (!result) {
                    return reject(new Error("Cloudinary upload failed"));
                }

                resolve({
                    secure_url: result.secure_url,
                });
            }
        );

        Readable.from(fileBuffer).pipe(stream);
    });
};

// Get owner's restaurants
export const getOwnerRestaurants = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const ownerId = req.user?._id;

    if (!ownerId) {
      res.status(401).json({
        message: "Unauthorized",
      });
      return;
    }

    const restaurant = await Restaurant.findOne({
      owner: ownerId,
    });

    // IMPORTANT:
    // No restaurant is normal for a new owner.
    if (!restaurant) {
      res.status(200).json({
        restaurant: null,
      });
      return;
    }

    res.status(200).json({
      restaurant,
    });
  } catch (error) {
    console.error("Error fetching owner restaurant:", error);

    res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Get owner's bookings
export const getOwnerBookings = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const ownerId = req.user?._id;

        if (!ownerId) {
            res.status(401).json({
                message: "Unauthorized",
            });
            return;
        }

        // Find restaurants owned by this owner
        const restaurants = await Restaurant.find({
            owner: ownerId,
        }).select("_id");

        if (restaurants.length === 0) {
            res.status(200).json({
                bookings: [],
            });
            return;
        }

        const restaurantIds = restaurants.map(
            (restaurant) => restaurant._id
        );

        // Find bookings for those restaurants
        const bookings = await booking
            .find({
                restaurant: { $in: restaurantIds },
            })
            .populate("restaurant")
            .sort({ createdAt: -1 });

        res.status(200).json({
            bookings,
        });
    } catch (error) {
        console.error("Error fetching owner bookings:", error);

        res.status(500).json({
            message: "Internal server error",
        });
    }
};

// Create owner restaurant
export const createOwnerRestaurant = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const existing = await Restaurant.findOne({
            owner: req.user?._id,
        });

        if (existing) {
            res.status(400).json({
                message: "Owner already has a restaurant",
            });
            return;
        }

        const {
            name,
            description,
            cuisine,
            priceRange,
            location,
            address,
            chef,
            tags,
            availableSlots,
            totalSeats,
        } = req.body;

        if (
            !name ||
            !description ||
            !cuisine ||
            !priceRange ||
            !location ||
            !address ||
            !chef ||
            !tags ||
            !availableSlots ||
            !totalSeats
        ) {
            res.status(400).json({
                message: "All fields are required",
            });
            return;
        }

        // Create slug
        const slug = name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");

        // Check slug
        const slugExists = await Restaurant.findOne({
            slug,
        });

        if (slugExists) {
            res.status(400).json({
                message: "A restaurant with this name already exists",
            });
            return;
        }

        // Upload image
        let imageUrl = "";

        if (req.file) {
            const uploadedImage = await uploadToCloudinary(
                req.file.buffer
            );

            imageUrl = uploadedImage.secure_url;
        }

        // Parse tags
        const parsedTags =
            typeof tags === "string"
                ? tags
                      .split(",")
                      .map((tag: string) => tag.trim())
                      .filter(Boolean)
                : tags;

        // Parse available slots
        const parsedSlots =
            typeof availableSlots === "string"
                ? availableSlots
                      .split(",")
                      .map((slot: string) => slot.trim())
                      .filter(Boolean)
                : availableSlots;

        // Create restaurant
        const restaurant = await Restaurant.create({
            name,
            slug,
            description,
            cuisine,
            priceRange,
            location,
            address,
            chef,
            image: imageUrl,
            tags: parsedTags,
            availableSlots: parsedSlots,
            totalSeats: totalSeats
                ? Number(totalSeats)
                : 20,
            owner: req.user?._id,
            status: "pending",
        });

        res.status(201).json({
            message: "Restaurant created successfully",
            restaurant,
        });
    } catch (error: any) {
        console.error("Error creating owner restaurant:", error);

        res.status(500).json({
            message: "Internal server error",
        });
    }
};

// Update owner's restaurant
export const updateOwnerRestaurant = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const ownerId = req.user?._id;

    if (!ownerId) {
      res.status(401).json({
        message: "Unauthorized",
      });
      return;
    }

    const restaurant = await Restaurant.findOne({
      owner: ownerId,
    });

    if (!restaurant) {
      res.status(404).json({
        message: "Restaurant not found for this owner",
      });
      return;
    }

    const {
      name,
      description,
      cuisine,
      priceRange,
      location,
      address,
      chef,
      tags,
      availableSlots,
      totalSeats,
    } = req.body;

    restaurant.name = name;
    restaurant.description = description;
    restaurant.cuisine = cuisine;
    restaurant.priceRange = priceRange;
    restaurant.location = location;
    restaurant.address = address;
    restaurant.chef = chef;
    restaurant.tags = tags;
    restaurant.availableSlots = availableSlots;
    restaurant.totalSeats = totalSeats;

    if (req.file) {
      restaurant.image = req.file.path;
    }

    await restaurant.save();

    res.status(200).json({
      restaurant,
    });
  } catch (error) {
    console.error("Error updating owner restaurant:", error);

    res.status(500).json({
      message: "Internal server error",
    });
  }
};
// Update booking status
export const updateBookingstatus = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const allowedStatuses = [
            "pending",
            "confirmed",
            "cancelled",
            "completed",
        ];

        if (!status || !allowedStatuses.includes(status)) {
            res.status(400).json({
                message: "Invalid booking status",
            });
            return;
        }

        const bookingData = await booking.findById(id).populate(
            "restaurant"
        );

        if (!bookingData) {
            res.status(404).json({
                message: "Booking not found",
            });
            return;
        }

        const restaurant = bookingData.restaurant as any;

        if (
            !restaurant ||
            restaurant.owner?.toString() !==
                req.user?._id?.toString()
        ) {
            res.status(403).json({
                message:
                    "You are not authorized to update this booking",
            });
            return;
        }

        bookingData.status = status;

        await bookingData.save();

        res.status(200).json({
            message: "Booking status updated successfully",
            booking: bookingData,
        });
    } catch (error: any) {
        console.error("Error updating booking status:", error);

        res.status(500).json({
            message: "Internal server error",
        });
    }
};