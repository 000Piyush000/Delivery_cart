import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { login, registerCustomer } from "../controllers/authController.js";

const router = Router();

router.post("/login", asyncHandler(login));
router.post("/register", asyncHandler(registerCustomer));

export default router;
