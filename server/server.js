import express from "express";
import cors from "cors";
import "dotenv/config";
import { clerkMiddleware, requireAuth } from "@clerk/express";

const app = express();

app.use(cors()); // middleware to allow cross-origin requests
app.use(express.json()); // middleware to parse JSON bodies
app.use(clerkMiddleware())

app.get("/", (req, res) => {
  res.send("Welcome to the server!");
});

app.use(requireAuth())
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port`, PORT);
});
