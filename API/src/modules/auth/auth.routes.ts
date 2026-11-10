import { Router } from "express";
import { login, logout, me, refresh, register } from "./auth.controller.js";
import { authenticate } from "../../middleware/authenticate.js";

const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/refresh", refresh);
authRouter.post("/logout", logout);
authRouter.get("/me", authenticate, me);

export default authRouter;
