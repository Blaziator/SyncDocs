import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.js";
import documentRoutes from "./routes/document.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.set("trust proxy", 1);

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
app.use("/api/documents", documentRoutes);

app.use(errorHandler);

export default app;