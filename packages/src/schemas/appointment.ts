import { z } from "zod";
import { APPOINTMENT_STATUS } from "../constants/appointment-status";
import { dateString, objectId, timeString } from "./common";

export const mobileSchema = z
	.string()
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
			name: z.string().trim().min(2).max(80),
			mobile: mobileSchema,
			gender: z.enum(["MALE", "FEMALE", "OTHER"]),
			dateOfBirth: dateString.optional(),
		}),
	]),
	purpose: z.string().trim().max(300).optional(),
});
export type CreateAppointmentBody = z.infer<typeof createAppointmentSchema>;

export const updateAppointmentSchema = z
	.object({
		purpose: z.string().trim().max(300).optional(),
		notes: z.string().trim().max(2000).optional(),
	})
	.refine((b) => b.purpose !== undefined || b.notes !== undefined, {
		message: "Provide purpose or notes to update",
	});
export type UpdateAppointmentBody = z.infer<typeof updateAppointmentSchema>;

export const partialMobileSchema = z
	.string()
	.trim()
	.regex(/^\d{3,10}$/, "Mobile must be between 3 and 10 digits");

export const appointmentListQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(10),
	sortBy: z
		.enum(["date", "startTime", "createdAt", "patientName"])
		.default("date"),
	sortOrder: z.enum(["asc", "desc"]).default("desc"),
	doctorId: objectId.optional(),
	patientId: objectId.optional(),
	mobile: partialMobileSchema.optional(),
	department: z.string().max(60).optional(),
	status: z.enum(APPOINTMENT_STATUS).optional(),
	dateFrom: dateString.optional(),
	dateTo: dateString.optional(),
});
export type AppointmentListQuery = z.infer<typeof appointmentListQuerySchema>;
