import { createDoctorSchema, objectId, updateDoctorSchema } from "@emr/shared";
import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requireRoles } from "../../middlewares/rbac.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { createDoctor, listDoctors, updateDoctor } from "./doctor.controller";

const router = Router();

// Create a new doctor profile and account
router.post(
	"/",
	requireAuth,
	requireRoles("SUPER_ADMIN"),
	validate({ body: createDoctorSchema }),
	createDoctor,
);

// List all active doctors
router.get("/", requireAuth, listDoctors);

// Update doctor profile (name, department, schedule, isActive)
router.put(
	"/:id",
	requireAuth,
	requireRoles("SUPER_ADMIN"),
	validate({
		params: z.object({ id: objectId }),
		body: updateDoctorSchema,
	}),
	updateDoctor,
);

export default router;
