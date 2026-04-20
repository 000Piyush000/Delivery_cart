import { Router } from "express";
import { uploadPod, verifyAndGetPod } from "../controllers/podController.js";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/uploadMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post("/:orderId", authenticate, authorize("rider"), upload.single("pod"), asyncHandler(uploadPod));
router.get(
  "/:orderId",
  authenticate,
  authorize("admin", "auditor", "support_agent", "rider"),
  asyncHandler(verifyAndGetPod)
);

export default router;
