 import { Router } from "express";
import { createOwnerRestaurant, getOwnerBookings, getOwnerRestaurants, updateBookingstatus, updateOwnerRestaurant } from "../controllers/ownercontroller.js";
import upload from "../config/multer.js";
import { ownerOnly, protect } from "../middlewares/auth.js";

 const ownerRouter = Router();

ownerRouter.use(protect)
ownerRouter.use(ownerOnly)


 ownerRouter.get("/restaurant",getOwnerRestaurants)
 ownerRouter.post("/restaurant",upload.single("image"),createOwnerRestaurant)
 ownerRouter.put("/restaurant",upload.single("image"),updateOwnerRestaurant)
 ownerRouter.get("/bookings",getOwnerBookings)
ownerRouter.put("/bookings/:id/status",updateBookingstatus)

export default ownerRouter;


