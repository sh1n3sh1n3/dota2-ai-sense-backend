import { Router } from "express";
import { checkJwt } from "../middleware/checkJwt";
// Middleware
import { asyncHandler } from "../middleware/asyncHandler";
import SteamController from "../controllers/SteamController";

const router = Router();
router.post("/get-answer", asyncHandler(SteamController.getAIResponse));

export default router;
