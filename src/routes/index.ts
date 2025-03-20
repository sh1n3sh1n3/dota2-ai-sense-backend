import { Router } from "express";
import auth from "./auth";
import user from "./user";
import aiAnswer from "./ai-answer";
import plan from "./plan";
const routes = Router();

routes.use("/auth", auth);
routes.use("/users", user);
routes.use("/ai-answer", aiAnswer);
routes.use("/plan", plan);
export default routes;
