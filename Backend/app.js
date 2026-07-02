import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.js";

const app = express();

app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
    res.send("SyncDocs API is running");
});

app.use("/api/auth", authRoutes);

export default app;