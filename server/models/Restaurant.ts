 import { Document, model, Schema, Types } from "mongoose";

export interface IRestaurant extends Document {
    name: string;
    slug: string;
    description: string;
    cuisine: string;
    priceRange: "$" | "$$" | "$$$" | "$$$$";
    rating: number;
    reviewCount: number;
    location: string;
    address: string;
    image: string;
    chef: string;
    tags: string[];
    availableSlots: string[];
    features: string[];
    exclusive: boolean;
    owner: Types.ObjectId;
    status: "pending" | "approved" | "rejected";
    totalSeats: number;
    createdAt: Date;
    updatedAt: Date;
}

const restaurantSchema = new Schema<IRestaurant>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        slug: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        description: {
            type: String,
            required: true,
            trim: true,
        },

        cuisine: {
            type: String,
            required: true,
            trim: true,
        },

        priceRange: {
            type: String,
            enum: ["$", "$$", "$$$", "$$$$"],
            required: true,
        },

        rating: {
            type: Number,
            default: 0,
        },

        reviewCount: {
            type: Number,
            default: 0,
        },

        location: {
            type: String,
            required: true,
            trim: true,
        },

        address: {
            type: String,
            required: true,
            trim: true,
        },

        image: {
            type: String,
            default: "",
        },

        chef: {
            type: String,
            required: true,
            trim: true,
        },

        tags: {
            type: [String],
            default: [],
        },

        availableSlots: {
            type: [String],
            default: [],
        },

        features: {
            type: [String],
            default: [],
        },

        exclusive: {
            type: Boolean,
            default: false,
        },

        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
        },

        totalSeats: {
            type: Number,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

export const Restaurant = model<IRestaurant>(
    "Restaurant",
    restaurantSchema
);