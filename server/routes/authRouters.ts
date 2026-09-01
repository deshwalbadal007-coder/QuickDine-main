 import { Router } from "express";
import { registeruser, loginuser, getMe } from "../controllers/authcontroller.js";

import { protect } from "../middlewares/auth.js";

const AuthRouter = Router();

AuthRouter.post("/register", registeruser);
AuthRouter.post("/login", loginuser);
AuthRouter.get("/me", protect , getMe)

export default AuthRouter;