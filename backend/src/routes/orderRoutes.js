import { Router } from "express";
import {
  createNewOrder,
  listOrders,
  submitOrderFeedback,
  trackOrder,
  updateStatus
} from "../controllers/orderController.js";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", authenticate, asyncHandler(listOrders));
router.post("/", authenticate, authorize("admin", "customer"), asyncHandler(createNewOrder));
router.get("/:id/track", authenticate, asyncHandler(trackOrder));
router.post("/:id/feedback", authenticate, authorize("customer"), asyncHandler(submitOrderFeedback));
router.patch("/:id/status", authenticate, authorize("admin", "rider"), asyncHandler(updateStatus));

export default router;
