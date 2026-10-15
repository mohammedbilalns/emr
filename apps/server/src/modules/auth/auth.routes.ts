import { loginSchema } from "@emr/shared";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { requireAuth } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { login, logout, me, refresh } from "./auth.controller";

const router = Router();

const loginLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: process.env.NODE_ENV === "production" ? 10 : 1000,
	standardHeaders: true,
	legacyHeaders: false,
});

// Authenticate credentials and issue access/refresh tokens
router.post("/login", loginLimiter, validate({ body: loginSchema }), login);

// Rotate tokens using HTTP-only refresh cookie
router.post("/refresh", refresh);

// Revoke active session and clear refresh cookie
router.post("/logout", requireAuth, logout);

// Return currently authenticated user session
router.get("/me", requireAuth, me);

export default router;
