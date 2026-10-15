import { loginSchema } from "@emr/shared";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { login, logout, me, refresh } from "../../controllers/auth.controller";
import { requireAuth } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";

const router = Router();

const loginLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: process.env.NODE_ENV === "test" ? 1000 : 10,
	standardHeaders: true,
	legacyHeaders: false,
});

router.post("/login", loginLimiter, validate({ body: loginSchema }), login);
router.post("/refresh", refresh);
router.post("/logout", requireAuth, logout);
router.get("/me", requireAuth, me);

export default router;
