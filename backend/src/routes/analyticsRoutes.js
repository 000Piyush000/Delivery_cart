import { Router } from "express";
import { getAnalytics, getAuditTrail, getDatabaseOverview } from "../controllers/analyticsController.js";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", authenticate, authorize("admin", "auditor"), asyncHandler(getAnalytics));
router.get("/audit", authenticate, authorize("admin", "auditor"), asyncHandler(getAuditTrail));
router.get("/database", authenticate, authorize("admin", "auditor"), asyncHandler(getDatabaseOverview));

export default router;
