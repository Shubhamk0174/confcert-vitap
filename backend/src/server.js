import express from "express";
import helmet from 'helmet';
import cors from 'cors';
import './config/env.js';
import authRoutes from './routes/auth.routes.js';
import certificateRouter from "./routes/certificate.routes.js";
import web3adminRoutes from './routes/web3admin.routes.js';
import web2adminRoutes from "./routes/web2admin.routes.js";

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

// Admin routes
app.use("/api/web2admin", web2adminRoutes);
app.use("/api/web3admin", web3adminRoutes);

// Certificate routes
app.use("/api/certificate", certificateRouter);



app.listen(PORT, () => {
    console.log("Server is running on port", PORT);
});