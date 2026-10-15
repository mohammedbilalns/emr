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

// Book a new appointment
router.post(
	"/",
	requireAuth,
	requireRoles("RECEPTIONIST", "SUPER_ADMIN"),
	validate({ body: createAppointmentSchema }),
	createAppointmentHandler,
);

// List appointments with filtering and pagination
router.get(
	"/",
	requireAuth,
	validate({ query: appointmentListQuerySchema }),
	listAppointmentsHandler,
);

// Get appointment details by ID
router.get(
	"/:id",
	requireAuth,
	validate({ params: idParams }),
	getAppointmentHandler,
);

// Update appointment details
router.put(
	"/:id",
	requireAuth,
	requireRoles("RECEPTIONIST", "SUPER_ADMIN", "DOCTOR"),
	validate({ params: idParams, body: updateAppointmentSchema }),
	updateAppointmentHandler,
);

// Cancel an appointment
router.delete(
	"/:id",
	requireAuth,
	requireRoles("RECEPTIONIST", "SUPER_ADMIN"),
	validate({ params: idParams }),
	cancelAppointmentHandler,
);

// Mark patient as arrived
router.post(
	"/:id/arrive",
	requireAuth,
	requireRoles("RECEPTIONIST", "SUPER_ADMIN"),
	validate({ params: idParams }),
	markArrivedHandler,
);

// Mark appointment as completed
router.post(
	"/:id/complete",
	requireAuth,
	requireRoles("DOCTOR", "SUPER_ADMIN"),
	validate({ params: idParams }),
	completeAppointmentHandler,
);

export default router;
