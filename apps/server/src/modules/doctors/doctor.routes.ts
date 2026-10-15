import {
	createDoctorSchema,
	objectId,
	updateDoctorScheduleSchema,
} from "@emr/shared";
import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requireRoles } from "../../middlewares/rbac.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { createDoctor, listDoctors, updateSchedule } from "./doctor.controller";

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

// Update weekly consultation schedule for a doctor
router.put(
	"/:id",
	requireAuth,
	requireRoles("SUPER_ADMIN"),
	validate({
		params: z.object({ id: objectId }),
		body: updateDoctorScheduleSchema,
	}),
	updateSchedule,
);

export default router;
