import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { user } from "../models/User.js";
import bcrypt from "bcrypt";
import { AuthRequest } from "../middlewares/auth.js";

const generateToken = (id: string): string => {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error("JWT_SECRET is not configured");
    }

    return jwt.sign(
        { id },
        secret,
        { expiresIn: "30d" }
    );
};

// =========================
// Register User
// =========================
export const registeruser = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { name, email, password, phone } = req.body;

        if (!name || !email || !password) {
            res.status(400).json({
                success: false,
                message: "Please provide name, email and password",
            });
            return;
        }

        const existingUser = await user.findOne({
            email: email.toLowerCase().trim(),
        });

        if (existingUser) {
            res.status(400).json({
                success: false,
                message: "User already exists",
            });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await user.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            phone,
            role: "user",
        });

        const token = generateToken(newUser._id.toString());

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            token,
            user: {
               _id: newUser._id.toString(),
                name: newUser.name,
                email: newUser.email,
                phone: newUser.phone,
                role: newUser.role,
            },
        });
    } catch (error) {
        console.error("Register error:", error);

        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// =========================
// Login User
// =========================
export const loginuser = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({
                success: false,
                message: "Please provide email and password",
            });
            return;
        }

        const existingUser = await user.findOne({
            email: email.toLowerCase().trim(),
        });

        if (!existingUser) {
            res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
            return;
        }

        const isPasswordCorrect = await bcrypt.compare(
            password,
            existingUser.password
        );

        if (!isPasswordCorrect) {
            res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
            return;
        }

        const token = generateToken(existingUser._id.toString());

        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                _id: existingUser._id.toString(),
                name: existingUser.name,
                email: existingUser.email,
                phone: existingUser.phone,
                role: existingUser.role,
            },
        });
    } catch (error) {
        console.error("Login error:", error);

        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// =========================
// Get Current User
// =========================
export const getMe = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: "Not authorized, user not found",
            });
            return;
        }

        res.status(200).json({
            success: true,
            user: req.user,
        });
    } catch (error) {
        console.error("Get user error:", error);

        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};