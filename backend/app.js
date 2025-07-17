import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import plotRoutes from "./routes/plotRoutes.js";
import alertRoutes from "./routes/alertRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import mlRoutes from "./routes/mlRoutes.js";

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use("/uploads", express.static("uploads"));

app.use("/api/auth", authRoutes);
app.use("/api/plots", plotRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/ml", mlRoutes);

app.get("/", (req, res) => res.send("Landwatch API running"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 