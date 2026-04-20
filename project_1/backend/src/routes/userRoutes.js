import { Router } from "express";
import { listUsersByRole } from "../controllers/userController.js";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/role/:role", authenticate, authorize("admin"), asyncHandler(listUsersByRole));

export default router;
