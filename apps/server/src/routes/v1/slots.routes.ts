import { slotsQuerySchema } from "@emr/shared";
import { Router } from "express";
import { getSlotsController } from "../../controllers/slot.controller";
import { requireAuth } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";

const router = Router();

// slots.routes.ts — any authenticated staff can view availability; booking itself is role-gated later
router.get(
	"/",
	requireAuth,
	validate({ query: slotsQuerySchema }),
	getSlotsController,
);

export default router;
