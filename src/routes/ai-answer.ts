import { Router } from "express";
import { checkJwt } from "../middleware/checkJwt";
// Middleware
import { asyncHandler } from "../middleware/asyncHandler";
import SteamController from "../controllers/SteamController";

const router = Router();
router.post("/get-answer", asyncHandler(SteamController.getAIResponse));
router.post("/save-qa", asyncHandler(SteamController.saveQA));
router.post("/get-qa", asyncHandler(SteamController.getQA));
router.post("/get-prequestion", asyncHandler(SteamController.getPrequestion));
router.post("/save-prequestion", asyncHandler(SteamController.savePreQuestion));
router.post("/edit-prequestion", asyncHandler(SteamController.editPreQuestion));
router.post(
  "/get-limitcount",
  asyncHandler(SteamController.getLimitQuestionCount)
);
router.post(
  "/delete-prequestion",
  asyncHandler(SteamController.deletePreQuestion)
);
export default router;
