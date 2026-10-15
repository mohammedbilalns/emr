import { slotsQuerySchema } from "@emr/shared";
import { Router } from "express";
import { getSlotsController } from "../../controllers/slot.controller";
import { requireAuth } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";

const router = Router();

// Fetch consultation time slots for a doctor on a specified date
router.get(
	"/",
	requireAuth,
	validate({ query: slotsQuerySchema }),
	getSlotsController,
);

export default router;
