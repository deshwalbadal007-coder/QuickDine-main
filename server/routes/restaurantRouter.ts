 import { Router } from "express";
import {
    getRestaurant,
    getFeaturedRestaurant,
    getRestaurantBySlug,
    getRestaurantAvailability,
} from "../controllers/restaurantController.js";

const restaurantRouter = Router();

// Get all approved restaurants
restaurantRouter.get("/", getRestaurant);

// Get featured restaurants
restaurantRouter.get("/featured", getFeaturedRestaurant);

// Get restaurant availability
restaurantRouter.get(
    "/:id/availability",
    getRestaurantAvailability
);

// Get restaurant by slug
restaurantRouter.get(
    "/:slug",
    getRestaurantBySlug
);

export default restaurantRouter;