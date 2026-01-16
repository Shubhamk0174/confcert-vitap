import express from "express";
import helmet from 'helmet';
import cors from 'cors';
import './config/env.js';
import authRoutes from './routes/auth.routes.js';
import certificateRouter from "./routes/certificate.routes.js";

const app = express();

// CORS configuration - allow all origins for now
app.use(cors({
  origin: '*',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Added for form data parsing
app.use(helmet());

const PORT = process.env.PORT || 5500;

// Health check route
app.get("/", (req, res) => {
    res.send("Server is running.");
});

// Auth routes
app.use("/api/auth", authRoutes);

// Certificate routes
app.use("/api/certificate", certificateRouter);

app.listen(PORT, () => {
    console.log("Server is running on port", PORT);
});