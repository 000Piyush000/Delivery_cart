import { Router } from "express";
import { getAnalytics, getAuditTrail } from "../controllers/analyticsController.js";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", authenticate, authorize("admin", "auditor"), asyncHandler(getAnalytics));
router.get("/audit", authenticate, authorize("auditor"), asyncHandler(getAuditTrail));

export default router;
