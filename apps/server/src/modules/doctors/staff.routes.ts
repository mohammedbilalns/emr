import { createStaffSchema } from "@emr/shared";
import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requireRoles } from "../../middlewares/rbac.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { createReceptionist } from "./doctor.controller";

const router = Router();

// Create a new receptionist user account
router.post(
	"/receptionists",
	requireAuth,
	requireRoles("SUPER_ADMIN"),
	validate({ body: createStaffSchema }),
	createReceptionist,
);

export default router;
