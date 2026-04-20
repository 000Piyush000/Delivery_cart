import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/authRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import riderRoutes from "./routes/riderRoutes.js";
import assignmentRoutes from "./routes/assignmentRoutes.js";
import podRoutes from "./routes/podRoutes.js";
import disputeRoutes from "./routes/disputeRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import hubRoutes from "./routes/hubRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { errorHandler } from "./middlewares/errorMiddleware.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:5173";

app.use(cors({
  origin: allowedOrigin,
  credentials: true
}));
app.use(express.json());
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "logistics-backend" });
});

app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/riders", riderRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/hubs", hubRoutes);
app.use("/api/users", userRoutes);
app.use("/api/pod", podRoutes);
app.use("/api/disputes", disputeRoutes);
app.use("/api/analytics", analyticsRoutes);

app.use(errorHandler);

export default app;
