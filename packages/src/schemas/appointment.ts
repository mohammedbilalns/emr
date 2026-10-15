import { z } from "zod";
import { APPOINTMENT_STATUS } from "../constants/appointment-status";
import { dateString, objectId, timeString } from "./common";

export const mobileSchema = z
	.string({ error: "Mobile number is required" })
	.trim()
	.regex(/^\d{10}$/, "Mobile must be 10 digits");

export const createAppointmentSchema = z.object({
	doctorId: objectId,
	date: dateString,
	startTime: timeString,
	patient: z.discriminatedUnion("type", [
		z.object({ type: z.literal("EXISTING"), patientId: objectId }),
		z.object({
			type: z.literal("NEW"),
			name: z
				.string({ error: "Patient name is required" })
				.trim()
				.min(1, "Patient name is required")
				.min(2, "Patient name must be at least 2 characters")
				.max(80, "Patient name cannot exceed 80 characters"),
			mobile: mobileSchema,
			gender: z.enum(["MALE", "FEMALE", "OTHER"], {
				error: "Please select a valid gender",
			}),
			dateOfBirth: dateString.optional(),
		}),
	]),
	purpose: z
		.string()
		.trim()
		.max(300, "Consultation purpose cannot exceed 300 characters")
		.optional(),
});
export type CreateAppointmentBody = z.infer<typeof createAppointmentSchema>;

export const updateAppointmentSchema = z
	.object({
		purpose: z
			.string()
			.trim()
			.max(300, "Consultation purpose cannot exceed 300 characters")
			.optional(),
		notes: z
			.string()
			.trim()
			.max(2000, "Consultation notes cannot exceed 2000 characters")
			.optional(),
	})
	.refine((b) => b.purpose !== undefined || b.notes !== undefined, {
		message: "Provide purpose or notes to update",
	});
export type UpdateAppointmentBody = z.infer<typeof updateAppointmentSchema>;

export const partialMobileSchema = z
	.string()
	.trim()
	.regex(/^\d{3,10}$/, "Search phone number must be between 3 and 10 digits");

export const appointmentListQuerySchema = z.object({
	page: z.coerce
		.number()
		.int("Page must be an integer")
		.min(1, "Page must be at least 1")
		.default(1),
	limit: z.coerce
		.number()
		.int("Limit must be an integer")
		.min(1, "Limit must be at least 1")
		.max(100, "Limit cannot exceed 100")
		.default(10),
	sortBy: z
		.enum(["date", "startTime", "createdAt", "patientName"])
		.default("date"),
	sortOrder: z.enum(["asc", "desc"]).default("desc"),
	doctorId: objectId.optional(),
	patientId: objectId.optional(),
	mobile: partialMobileSchema.optional(),
	department: z
		.string()
		.max(60, "Department cannot exceed 60 characters")
		.optional(),
	status: z.enum(APPOINTMENT_STATUS).optional(),
	dateFrom: dateString.optional(),
	dateTo: dateString.optional(),
});
export type AppointmentListQuery = z.infer<typeof appointmentListQuerySchema>;
