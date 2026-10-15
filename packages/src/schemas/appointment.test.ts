import { describe, expect, it } from "vitest";
import {
	createAppointmentSchema,
	mobileSchema,
	updateAppointmentSchema,
} from "./appointment";

describe("Appointment Schema Validation", () => {
	const validObjectId = "507f1f77bcf86cd799439011";

	describe("mobileSchema", () => {
		it("accepts valid 10-digit mobile number", () => {
			expect(mobileSchema.safeParse("9876543210").success).toBe(true);
			expect(mobileSchema.safeParse("1234567890").success).toBe(true);
		});

		it("rejects numbers shorter or longer than 10 digits", () => {
			expect(mobileSchema.safeParse("987654321").success).toBe(false); // 9 digits
			expect(mobileSchema.safeParse("98765432100").success).toBe(false); // 11 digits
		});

		it("rejects non-digit characters", () => {
			expect(mobileSchema.safeParse("987654321a").success).toBe(false);
			expect(mobileSchema.safeParse("+91987654321").success).toBe(false);
			expect(mobileSchema.safeParse("98765 43210").success).toBe(false);
		});
	});

	describe("createAppointmentSchema", () => {
		const baseAppointment = {
			doctorId: validObjectId,
			date: "2026-10-25",
			startTime: "09:30",
		};

		it("validates booking for an existing patient", () => {
			const result = createAppointmentSchema.safeParse({
				...baseAppointment,
				patient: {
					type: "EXISTING",
					patientId: validObjectId,
				},
				purpose: "Follow-up",
			});
			expect(result.success).toBe(true);
		});

		it("validates booking for a newly registered patient", () => {
			const result = createAppointmentSchema.safeParse({
				...baseAppointment,
				patient: {
					type: "NEW",
					name: "Rose Tyler",
					mobile: "9876543210",
					gender: "FEMALE",
					dateOfBirth: "1994-04-27",
				},
				purpose: "Initial consultation",
			});
			expect(result.success).toBe(true);
		});

		it("rejects new patient booking when mobile number is invalid", () => {
			const result = createAppointmentSchema.safeParse({
				...baseAppointment,
				patient: {
					type: "NEW",
					name: "Rose Tyler",
					mobile: "123",
					gender: "FEMALE",
				},
			});
			expect(result.success).toBe(false);
		});

		it("rejects malformed date or time strings", () => {
			expect(
				createAppointmentSchema.safeParse({
					...baseAppointment,
					date: "25-10-2026", // Invalid format (must be YYYY-MM-DD)
					patient: { type: "EXISTING", patientId: validObjectId },
				}).success,
			).toBe(false);

			expect(
				createAppointmentSchema.safeParse({
					...baseAppointment,
					startTime: "9:30", // Invalid format (must be HH:mm)
					patient: { type: "EXISTING", patientId: validObjectId },
				}).success,
			).toBe(false);
		});
	});

	describe("updateAppointmentSchema", () => {
		it("accepts update with purpose only", () => {
			const result = updateAppointmentSchema.safeParse({
				purpose: "Updated purpose",
			});
			expect(result.success).toBe(true);
		});

		it("accepts update with notes only", () => {
			const result = updateAppointmentSchema.safeParse({
				notes: "Patient reports feeling better",
			});
			expect(result.success).toBe(true);
		});

		it("rejects empty update without purpose or notes", () => {
			const result = updateAppointmentSchema.safeParse({});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0]?.message).toMatch(
					/Provide purpose or notes to update/i,
				);
			}
		});
	});
});
