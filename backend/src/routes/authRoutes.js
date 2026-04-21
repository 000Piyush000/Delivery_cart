import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { login, registerAdmin, registerCustomer } from "../controllers/authController.js";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/login", asyncHandler(login));
router.post("/register", asyncHandler(registerCustomer));
router.post("/register-admin", authenticate, authorize("admin"), asyncHandler(registerAdmin));

export default router;
