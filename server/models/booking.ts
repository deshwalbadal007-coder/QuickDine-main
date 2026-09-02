 import { Document, model, Schema, Types } from "mongoose";
import crypto from "crypto";

export interface Ibooking extends Document {
    user: Types.ObjectId;
    restaurant: Types.ObjectId;
    date: Date;
    time: string;
    guests: number;
    occasion?: string;
    specialRequests?: string;
    status: "confirmed" | "cancelled" | "completed";
    bookingId: string;
    createdAt: Date;
    updatedAt: Date;
}

const bookingSchema = new Schema<Ibooking>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        restaurant: {
            type: Schema.Types.ObjectId,
            ref: "Restaurant",
            required: true,
        },

        date: {
            type: Date,
            required: true,
        },

        time: {
            type: String,
            required: true,
        },

        guests: {
            type: Number,
            required: true,
            min: 1,
        },

        occasion: {
            type: String,
            trim: true,
        },

        specialRequests: {
            type: String,
            trim: true,
        },

        status: {
            type: String,
            enum: ["confirmed", "cancelled", "completed"],
            default: "confirmed",
        },

        bookingId: {
            type: String,
            required: true,
            unique: true,
            default: () =>
                `GR-${crypto
                    .randomBytes(4)
                    .toString("hex")
                    .toUpperCase()}`,
        },
    },
    {
        timestamps: true,
    }
);

export const booking = model<Ibooking>("Booking", bookingSchema);