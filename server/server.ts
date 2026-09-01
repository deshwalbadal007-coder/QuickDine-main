 import "dotenv/config";
import express, { Request, Response } from 'express';
import cors from "cors";
import { from } from "node:stream/iter";
import connectDB from "./config/db.js";
import restaurantRouter from "./routes/restaurantRouter.js";
import AuthRouter from "./routes/authRouters.js";
import bookingRoutes from "./routes/bookingroutes.js";
import ownerRouter from "./routes/ownerRoutes.js";
import adminRouter from "./routes/adminRouts.js";

const app = express();

await connectDB()

// Middleware
app.use(cors())
app.use(express.json());

const port = process.env.PORT || 3000;

app.get('/', (req: Request, res: Response) => {
    res.send('Server is Live!');
});
app.use('/api/auth',AuthRouter)
app.use('/api/restaurants',restaurantRouter)
app.use('/api/bookings',bookingRoutes)
app.use('/api/owner',ownerRouter)
app.use('/api/admin',adminRouter)

app.use((err: Error, req: Request, res: Response, next: Function) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal Server Error' ,
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
    });
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});