import { describe, expect, it } from "vitest";
import { scheduleSchema, sessionSchema } from "./doctor";

describe("Doctor Schedule Schema Validation", () => {
	describe("sessionSchema", () => {
		it("accepts valid session where end is after start", () => {
			const result = sessionSchema.safeParse({
				start: "09:00",
				end: "12:00",
			});
			expect(result.success).toBe(true);
		});

		it("rejects session where end is equal to start", () => {
			const result = sessionSchema.safeParse({
				start: "09:00",
				end: "09:00",
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0]?.message).toMatch(
					/Session end must be after start/i,
				);
			}
		});

		it("rejects session where end is before start", () => {
			const result = sessionSchema.safeParse({
				start: "14:00",
				end: "11:00",
			});
			expect(result.success).toBe(false);
		});
	});

	describe("scheduleSchema", () => {
		const validBaseSchedule = {
			workingDays: [1, 2, 3, 4, 5],
			sessions: [
				{ start: "09:00", end: "12:00" },
				{ start: "13:00", end: "17:00" },
			],
			breaks: [{ start: "12:00", end: "13:00" }],
			slotDuration: 15,
		};

		it("accepts a well-formed clinic schedule", () => {
			const result = scheduleSchema.safeParse(validBaseSchedule);
			expect(result.success).toBe(true);
		});

		it("rejects overlapping sessions", () => {
			const result = scheduleSchema.safeParse({
				...validBaseSchedule,
				sessions: [
					{ start: "09:00", end: "13:00" },
					{ start: "12:30", end: "17:00" }, // Overlaps by 30 mins
				],
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0]?.message).toMatch(
					/Sessions must not overlap/i,
				);
			}
		});

		it("rejects break that falls outside working day boundaries", () => {
			const result = scheduleSchema.safeParse({
				...validBaseSchedule,
				sessions: [{ start: "09:00", end: "12:00" }],
				breaks: [{ start: "12:00", end: "13:00" }], // Starts at day end
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0]?.message).toMatch(
					/Breaks must fall within the working day/i,
				);
			}
		});

		it("rejects overlapping breaks", () => {
			const result = scheduleSchema.safeParse({
				...validBaseSchedule,
				sessions: [{ start: "09:00", end: "17:00" }],
				breaks: [
					{ start: "12:00", end: "13:00" },
					{ start: "12:30", end: "13:30" },
				],
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0]?.message).toMatch(
					/Breaks must not overlap/i,
				);
			}
		});

		it("enforces slot duration bounds between 5 and 60 minutes", () => {
			expect(
				scheduleSchema.safeParse({
					...validBaseSchedule,
					slotDuration: 4,
				}).success,
			).toBe(false);

			expect(
				scheduleSchema.safeParse({
					...validBaseSchedule,
					slotDuration: 61,
				}).success,
			).toBe(false);

			expect(
				scheduleSchema.safeParse({
					...validBaseSchedule,
					slotDuration: 30,
				}).success,
			).toBe(true);
		});

		it("requires at least one working day", () => {
			const result = scheduleSchema.safeParse({
				...validBaseSchedule,
				workingDays: [],
			});
			expect(result.success).toBe(false);
		});
	});
});
