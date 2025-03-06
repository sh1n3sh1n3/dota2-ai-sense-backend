import { Router } from "express";
import auth from "./auth";
import user from "./user";
import aiAnswer from "./ai-answer";
const routes = Router();

routes.use("/auth", auth);
routes.use("/users", user);
routes.use("/ai-answer", aiAnswer);
export default routes;
