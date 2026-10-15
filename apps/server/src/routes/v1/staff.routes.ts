import { createStaffSchema } from "@emr/shared";
import { Router } from "express";
import { createReceptionist } from "../../controllers/doctor.controller";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requireRoles } from "../../middlewares/rbac.middleware";
import { validate } from "../../middlewares/validate.middleware";

const router = Router();

// staff.routes.ts
router.post(
	"/receptionists",
	requireAuth,
	requireRoles("SUPER_ADMIN"),
	validate({ body: createStaffSchema }),
	createReceptionist,
);

export default router;
