 import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { user } from "../models/User.js";
import { IUser } from "../models/User.js";

export interface AuthRequest extends Request {
    user?: IUser;
}

export const protect = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    let token: string | undefined;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer ")
    ) {
        try {
            token = req.headers.authorization.split(" ")[1];

            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET as string
            ) as { id: string };

            const existingUser = await user
                .findById(decoded.id)
                .select("-password");

            if (!existingUser) {
                res.status(401).json({
                    message: "Not authorized, user not found",
                });
                return;
            }

            req.user = existingUser;

            next();
            return;
        } catch (error) {
            console.error("Auth Middleware Error:", error);

            res.status(401).json({
                message: "Not authorized, token failed",
            });
            return;
        }
    }

    res.status(401).json({
        message: "Not authorized, no token",
    });
};


// Admin only
export const adminOnly = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void => {
    if (req.user && req.user.role === "admin") {
        next();
        return;
    }

    res.status(403).json({
        message: "Not authorized as an admin",
    });
};


// Owner OR Admin
export const ownerOnly = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void => {
    if (
        req.user &&
        (req.user.role === "owner" || req.user.role === "admin")
    ) {
        next();
        return;
    }

    res.status(403).json({
        message: "Not authorized as an owner",
    });
};