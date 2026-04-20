import { Router } from "express";
import {
  assignNearestRider,
  assignRiderManually,
  listAssignments,
  unassignOrder,
  rejectAssignment
} from "../controllers/assignmentController.js";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", authenticate, authorize("admin"), asyncHandler(listAssignments));
router.post("/:orderId/manual", authenticate, authorize("admin"), asyncHandler(assignRiderManually));
router.post("/:orderId/auto", authenticate, authorize("admin"), asyncHandler(assignNearestRider));
router.delete("/:orderId", authenticate, authorize("admin"), asyncHandler(unassignOrder));
router.post("/:orderId/reject/:riderId", authenticate, authorize("rider"), asyncHandler(rejectAssignment));

export default router;
