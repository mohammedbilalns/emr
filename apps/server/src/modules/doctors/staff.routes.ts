import { createStaffSchema } from "@emr/shared";
import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requireRoles } from "../../middlewares/rbac.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { createReceptionist, listReceptionists } from "./doctor.controller";

const router = Router();

// Create a new receptionist user account
router.post(
	"/receptionists",
	requireAuth,
	requireRoles("SUPER_ADMIN"),
	validate({ body: createStaffSchema }),
	createReceptionist,
);

// List all receptionist staff accounts
router.get(
	"/receptionists",
	requireAuth,
	requireRoles("SUPER_ADMIN"),
	listReceptionists,
);

router.get("/", requireAuth, requireRoles("SUPER_ADMIN"), listReceptionists);

export default router;
