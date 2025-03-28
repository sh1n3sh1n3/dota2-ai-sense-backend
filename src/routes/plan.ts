import { Router } from "express";
import { checkJwt } from "../middleware/checkJwt";
// Middleware
import { asyncHandler } from "../middleware/asyncHandler";
import PlanController from "../controllers/PlanController";

const router = Router();
router.post("/purchase-plan", asyncHandler(PlanController.purchasePlan));
router.get("/get-prices", asyncHandler(PlanController.getPrices));
router.post("/webhook", asyncHandler(PlanController.webhook));
router.post("/cancel-plan", asyncHandler(PlanController.cancelSubscription));
router.post("/webhook", asyncHandler(PlanController.webhook));
export default router;
