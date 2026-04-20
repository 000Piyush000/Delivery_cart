import { Router } from "express";
import {
  addRider,
  getMyTasks,
  listRiders,
  removeRider,
  setAvailability
} from "../controllers/riderController.js";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", authenticate, authorize("admin"), asyncHandler(listRiders));
router.post("/", authenticate, authorize("admin"), asyncHandler(addRider));
router.delete("/:riderId", authenticate, authorize("admin"), asyncHandler(removeRider));
router.get("/me/tasks", authenticate, authorize("rider"), asyncHandler(getMyTasks));
router.patch("/:riderId/availability", authenticate, authorize("admin", "rider"), asyncHandler(setAvailability));

export default router;
