import { Router } from "express";
import { validate } from "../../middleware/validate";
import { authenticate } from "../../middleware/auth";
import { loginLimiter, registerLimiter } from "../../middleware/rateLimiter";
import { registerSchema, loginSchema } from "./auth.schema";
import * as authController from "./auth.controller";

const router = Router();

router.post("/register", registerLimiter, validate({ body: registerSchema }), authController.registerHandler);
router.post("/login", loginLimiter, validate({ body: loginSchema }), authController.loginHandler);
router.post("/refresh", authController.refreshHandler);
router.post("/logout", authController.logoutHandler);
router.get("/me", authenticate, authController.meHandler);

export default router;
