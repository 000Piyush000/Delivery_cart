import { Router } from "express";
import { createNewHub, listHubs } from "../controllers/hubController.js";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", authenticate, authorize("admin"), asyncHandler(listHubs));
router.post("/", authenticate, authorize("admin"), asyncHandler(createNewHub));

export default router;
