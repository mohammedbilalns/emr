import { z } from "zod";
import { timeString } from "./common";

export const sessionSchema = z
	.object({ start: timeString, end: timeString })
	.refine((s) => s.end > s.start, {
		message: "Session end must be after start",
	});

export const scheduleSchema = z
	.object({
		workingDays: z
			.array(z.number().int().min(0).max(6))
			.min(1, "At least one working day is required"),
		sessions: z.array(sessionSchema).min(1, "At least one session is required"),
		breaks: z.array(sessionSchema).default([]),
		slotDuration: z.number().int().min(5).max(60),
	})
	.superRefine((schedule, ctx) => {
		const sessions = [...schedule.sessions].sort((a, b) =>
			a.start.localeCompare(b.start),
		);
		for (let i = 1; i < sessions.length; i++) {
			if (sessions[i].start < sessions[i - 1].end) {
				ctx.addIssue({
					code: "custom",
					path: ["sessions"],
					message: "Sessions must not overlap",
				});
				return;
			}
		}
		const dayStart = sessions[0].start;
		const dayEnd = sessions[sessions.length - 1].end;
		const breaks = [...schedule.breaks].sort((a, b) =>
			a.start.localeCompare(b.start),
		);
		for (let i = 0; i < breaks.length; i++) {
			if (breaks[i].start < dayStart || breaks[i].end > dayEnd) {
				ctx.addIssue({
					code: "custom",
					path: ["breaks"],
					message: "Breaks must fall within the working day",
				});
				return;
			}
			if (i > 0 && breaks[i].start < breaks[i - 1].end) {
				ctx.addIssue({
					code: "custom",
					path: ["breaks"],
					message: "Breaks must not overlap",
				});
				return;
			}
		}
	});

export const createDoctorSchema = z.object({
	name: z.string().min(2).max(80),
	email: z.email(),
	password: z.string().min(8),
	department: z.string().min(2).max(60),
	schedule: scheduleSchema,
});
export type CreateDoctorBody = z.infer<typeof createDoctorSchema>;

export const updateDoctorScheduleSchema = z.object({
	schedule: scheduleSchema,
});
export type UpdateDoctorScheduleBody = z.infer<
	typeof updateDoctorScheduleSchema
>;

export const createStaffSchema = z.object({
	name: z.string().min(2).max(80),
	email: z.email(),
	password: z.string().min(8),
});
export type CreateStaffBody = z.infer<typeof createStaffSchema>;

export const slotsQuerySchema = z.object({
	doctorId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid doctor id"),
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
});
export type SlotsQuery = z.infer<typeof slotsQuerySchema>;
