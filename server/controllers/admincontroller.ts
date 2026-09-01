import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.js";
import { Restaurant } from "../models/Restaurant.js";
import { user } from "../models/User.js";
import { booking } from "../models/booking.js";
 


 export const getAllRestaurants = async (req : AuthRequest, res: Response):Promise<void>=>{
try{
    const restaurant = await Restaurant.find({}).populate("owner" , "name email phone").sort({createdAt: -1})
res.json(restaurant)
}catch(error: any)
{
console.error(error);
res.status(400).json({message:error.message});
}

 }

 export const approveRestaurant = async (req : AuthRequest, res: Response):Promise<void>=>{
try{
const {status}=req.body
if(!status||!["approved","rejected","pending"].includes(status)){
    res.status(400).json({message:"Please provide a valid approval status"});
    return;
}
const restaurant = await Restaurant.findById(req.params.id);
if(!restaurant){
    res.status(404).json({message: "Restaurant profile not found"})
    return;
}
restaurant.status = status;
await restaurant.save();
res.json(restaurant);
}catch(error)
{
console.error(error);
res.status(400).json({error});

}

 }

 export const getAdminStats = async (req : AuthRequest, res: Response):Promise<void>=>{
try{
const totalUsers = await user.countDocuments({role:"user"});
const totalOwner = await user.countDocuments({role:"owner"});
const totalbokings = await booking.countDocuments({});
const totalRestaurant = await Restaurant.countDocuments({})

const latestBookings = await booking.find({}).populate("user","name email").
populate("restaurant","name").sort({createdAt: -1}).limit(10)

res.json({
    users:{
        totalUsers,
        totalOwner,
        total:totalUsers + totalOwner,
    },
    restaurants:{
        total:totalRestaurant,
    },
    booking:{
        total:totalbokings,
    },
    latestBookings
})

}catch(error:any)
{
console.error(error);
res.status(400).json({message:error.message});

}

 }