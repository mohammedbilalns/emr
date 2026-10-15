import {
	createDoctorSchema,
	objectId,
	updateDoctorScheduleSchema,
} from "@emr/shared";
import { Router } from "express";
import { z } from "zod";
import {
	createDoctor,
	listDoctors,
	updateSchedule,
} from "../../controllers/doctor.controller";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requireRoles } from "../../middlewares/rbac.middleware";
import { validate } from "../../middlewares/validate.middleware";

const router = Router();

router.post(
	"/",
	requireAuth,
	requireRoles("SUPER_ADMIN"),
	validate({ body: createDoctorSchema }),
	createDoctor,
);
router.get("/", requireAuth, listDoctors);
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
