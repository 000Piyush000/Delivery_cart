import { Router } from "express";
import { listDisputes, raiseDispute, resolveDispute } from "../controllers/disputeController.js";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", authenticate, authorize("support_agent", "auditor", "admin"), asyncHandler(listDisputes));
router.post("/:orderId", authenticate, authorize("customer"), asyncHandler(raiseDispute));
router.patch("/:id", authenticate, authorize("support_agent"), asyncHandler(resolveDispute));

export default router;
