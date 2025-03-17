import { Router } from "express";
import { checkJwt } from "../middleware/checkJwt";
// Middleware
import { asyncHandler } from "../middleware/asyncHandler";
import SteamController from "../controllers/SteamController";

const router = Router();
router.post("/get-answer", asyncHandler(SteamController.getAIResponse));
router.post("/save-qa", asyncHandler(SteamController.saveQA));
router.post("/get-qa", asyncHandler(SteamController.getQA));
export default router;
