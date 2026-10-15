import { loginSchema } from "@emr/shared";
import { Router } from "express";
import { login, logout, me, refresh } from "../../controllers/auth.controller";
import { requireAuth } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";

const router = Router();

router.post("/login", validate({ body: loginSchema }), login);
router.post("/refresh", refresh);
router.post("/logout", requireAuth, logout);
router.get("/me", requireAuth, me);

export default router;
