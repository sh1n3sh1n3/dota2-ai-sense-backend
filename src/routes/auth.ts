import { Router } from "express";
import AuthController from "../controllers/AuthController";
import { checkJwt } from "../middleware/checkJwt";
import { checkRole } from "../middleware/checkRole";
// Middleware
import { asyncHandler } from "../middleware/asyncHandler";

const router = Router();
// Login route

router.post("/verify-steam", asyncHandler(AuthController.verifySteam));
router.get("/me", [checkJwt], asyncHandler(AuthController.authme));
export default router;
