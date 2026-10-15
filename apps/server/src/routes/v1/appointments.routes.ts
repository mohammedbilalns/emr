import {
	appointmentListQuerySchema,
	createAppointmentSchema,
	objectId,
	updateAppointmentSchema,
} from "@emr/shared";
import { Router } from "express";
import { z } from "zod";
import {
	cancelAppointmentHandler,
	completeAppointmentHandler,
	createAppointmentHandler,
	getAppointmentHandler,
	listAppointmentsHandler,
	markArrivedHandler,
	updateAppointmentHandler,
} from "../../controllers/appointment.controller";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requireRoles } from "../../middlewares/rbac.middleware";
import { validate } from "../../middlewares/validate.middleware";

const idParams = z.object({ id: objectId });

const router = Router();

router.post(
	"/",
	requireAuth,
	requireRoles("RECEPTIONIST", "SUPER_ADMIN"),
	validate({ body: createAppointmentSchema }),
	createAppointmentHandler,
);

router.get(
	"/",
	requireAuth,
	validate({ query: appointmentListQuerySchema }),
	listAppointmentsHandler,
);

router.get(
	"/:id",
	requireAuth,
	validate({ params: idParams }),
	getAppointmentHandler,
);

router.put(
	"/:id",
	requireAuth,
	requireRoles("RECEPTIONIST", "SUPER_ADMIN", "DOCTOR"),
	validate({ params: idParams, body: updateAppointmentSchema }),
	updateAppointmentHandler,
);

router.delete(
	"/:id",
	requireAuth,
	requireRoles("RECEPTIONIST", "SUPER_ADMIN"),
	validate({ params: idParams }),
	cancelAppointmentHandler,
);

router.post(
	"/:id/arrive",
	requireAuth,
	requireRoles("RECEPTIONIST", "SUPER_ADMIN"),
	validate({ params: idParams }),
	markArrivedHandler,
);

router.post(
	"/:id/complete",
	requireAuth,
	requireRoles("DOCTOR", "SUPER_ADMIN"),
	validate({ params: idParams }),
	completeAppointmentHandler,
);

export default router;
