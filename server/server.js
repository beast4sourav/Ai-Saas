import  express  from "express";
import cors from "cors";
import "dotenv/config";

const app = express();

app.use(cors());// middleware to allow cross-origin requests
app.use(express.json()); // middleware to parse JSON bodies

app.get("/", (req, res) => {
    res.send("Welcome to the server!");
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log(`Server is running on port`,PORT);
})