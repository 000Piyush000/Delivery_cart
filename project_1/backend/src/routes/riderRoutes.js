import { Router } from "express";
import { getMyTasks, listRiders, setAvailability } from "../controllers/riderController.js";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", authenticate, authorize("admin"), asyncHandler(listRiders));
router.get("/me/tasks", authenticate, authorize("rider"), asyncHandler(getMyTasks));
router.patch("/:riderId/availability", authenticate, authorize("admin", "rider"), asyncHandler(setAvailability));

export default router;
