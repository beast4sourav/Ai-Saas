import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/db.js";
import dotenv from "dotenv";
import { clerkMiddleware, requireAuth } from "@clerk/express";
import aiRouter from "./routes/aiRoutes.js";
import connectCloudniary from "./config/cloudinary.js";
import userRouter from "./routes/userRoutes.js";


dotenv.config();
connectDB();

const app = express();

await connectCloudniary()

app.use(cors()); // middleware to allow cross-origin requests
app.use(express.json()); // middleware to parse JSON bodies
app.use(clerkMiddleware());

app.get("/", (req, res) => {
  res.send("Welcome to the server!");
});

app.use(requireAuth())


app.use("/api/ai", aiRouter)
app.use("/api/user", userRouter)


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port`, PORT);
});
