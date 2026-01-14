import express from "express";
import helmet from 'helmet';
import './config/env.js';
import authRoutes from './routes/auth.routes.js';

const app = express();

app.use(express.json());
app.use(helmet());

const PORT = process.env.PORT || 5500;

// Health check route
app.get("/", (req, res) => {
    res.send("Server is running.");
});

// Auth routes
app.use("/api/auth", authRoutes);

app.listen(PORT, () => {
    console.log("Server is running on port", PORT);
});