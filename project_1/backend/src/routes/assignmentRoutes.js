import { Router } from "express";
import {
  assignNearestRider,
  assignRiderManually,
  listAssignments
} from "../controllers/assignmentController.js";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", authenticate, authorize("admin"), asyncHandler(listAssignments));
router.post("/:orderId/manual", authenticate, authorize("admin"), asyncHandler(assignRiderManually));
router.post("/:orderId/auto", authenticate, authorize("admin"), asyncHandler(assignNearestRider));

export default router;
