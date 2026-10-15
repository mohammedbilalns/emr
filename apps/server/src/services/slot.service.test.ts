import { describe, expect, it } from "vitest";
import type { ISchedule } from "../models/doctor.model";
import { generateSlots } from "./slot.service";

describe("slot.service - generateSlots", () => {
	const baseSchedule: ISchedule = {
		workingDays: [1, 2, 3, 4, 5], // Mon-Fri
		sessions: [{ start: "09:00", end: "11:00" }],
		breaks: [],
		slotDuration: 30,
	};

	// 2026-10-19 is a Monday (workingDays includes 1)
	const futureMonday = "2026-10-19";
	const mockNow = new Date("2026-10-15T08:00:00"); // Thursday 08:00

	it("1. generates correct slots for standard single session (09:00-11:00 @ 30m)", () => {
		const slots = generateSlots(baseSchedule, futureMonday, mockNow);
		expect(slots).toEqual([
			{ startTime: "09:00", endTime: "09:30" },
			{ startTime: "09:30", endTime: "10:00" },
			{ startTime: "10:00", endTime: "10:30" },
			{ startTime: "10:30", endTime: "11:00" },
		]);
	});

	it("2. handles exact boundary slots correctly (09:00-10:00 @ 15m -> exactly 4 slots)", () => {
		const schedule: ISchedule = {
			workingDays: [1, 2, 3, 4, 5],
			sessions: [{ start: "09:00", end: "10:00" }],
			breaks: [],
			slotDuration: 15,
		};
		const slots = generateSlots(schedule, futureMonday, mockNow);
		expect(slots).toEqual([
			{ startTime: "09:00", endTime: "09:15" },
			{ startTime: "09:15", endTime: "09:30" },
			{ startTime: "09:30", endTime: "09:45" },
			{ startTime: "09:45", endTime: "10:00" },
		]);
	});

	it("3. excludes slots that overlap a break (09:00-12:00 @ 30m with 10:00-10:30 break)", () => {
		const schedule: ISchedule = {
			workingDays: [1, 2, 3, 4, 5],
			sessions: [{ start: "09:00", end: "12:00" }],
			breaks: [{ start: "10:00", end: "10:30" }],
			slotDuration: 30,
		};
		const slots = generateSlots(schedule, futureMonday, mockNow);
		expect(slots).toEqual([
			{ startTime: "09:00", endTime: "09:30" },
			{ startTime: "09:30", endTime: "10:00" },
			{ startTime: "10:30", endTime: "11:00" },
			{ startTime: "11:00", endTime: "11:30" },
			{ startTime: "11:30", endTime: "12:00" },
		]);
	});

	it("4. excludes multiple slots overlapping a longer break (10:00-11:00 break)", () => {
		const schedule: ISchedule = {
			workingDays: [1, 2, 3, 4, 5],
			sessions: [{ start: "09:00", end: "12:00" }],
			breaks: [{ start: "10:00", end: "11:00" }],
			slotDuration: 30,
		};
		const slots = generateSlots(schedule, futureMonday, mockNow);
		expect(slots).toEqual([
			{ startTime: "09:00", endTime: "09:30" },
			{ startTime: "09:30", endTime: "10:00" },
			{ startTime: "11:00", endTime: "11:30" },
			{ startTime: "11:30", endTime: "12:00" },
		]);
	});

	it("5. generates slots across multiple non-overlapping sessions (morning + afternoon)", () => {
		const schedule: ISchedule = {
			workingDays: [1, 2, 3, 4, 5],
			sessions: [
				{ start: "09:00", end: "11:00" },
				{ start: "14:00", end: "16:00" },
			],
			breaks: [],
			slotDuration: 30,
		};
		const slots = generateSlots(schedule, futureMonday, mockNow);
		expect(slots).toHaveLength(8);
		expect(slots[0]).toEqual({ startTime: "09:00", endTime: "09:30" });
		expect(slots[3]).toEqual({ startTime: "10:30", endTime: "11:00" });
		expect(slots[4]).toEqual({ startTime: "14:00", endTime: "14:30" });
		expect(slots[7]).toEqual({ startTime: "15:30", endTime: "16:00" });
	});

	it("6. returns empty array for non-working days (e.g. Sunday)", () => {
		// 2026-10-18 is Sunday (day 0)
		const sunday = "2026-10-18";
		const slots = generateSlots(baseSchedule, sunday, mockNow);
		expect(slots).toEqual([]);
	});

	it("7. handles past date and same-day time filtering", () => {
		// Past date
		const pastDate = "2026-10-10";
		expect(generateSlots(baseSchedule, pastDate, mockNow)).toEqual([]);

		// Same date with current time 10:15
		// Today is Thursday 2026-10-15
		const todayDate = "2026-10-15";
		const scheduleWithExtendedHours: ISchedule = {
			workingDays: [4], // Thursday
			sessions: [{ start: "09:00", end: "12:00" }],
			breaks: [],
			slotDuration: 30,
		};
		const nowAt1015 = new Date("2026-10-15T10:15:00");
		const remainingSlots = generateSlots(
			scheduleWithExtendedHours,
			todayDate,
			nowAt1015,
		);

		// Slots are 09:00, 09:30, 10:00, 10:30, 11:00, 11:30.
		// Since now is 10:15, slots with startTime <= 10:15 (i.e. 09:00, 09:30, 10:00) are filtered out.
		expect(remainingSlots).toEqual([
			{ startTime: "10:30", endTime: "11:00" },
			{ startTime: "11:00", endTime: "11:30" },
			{ startTime: "11:30", endTime: "12:00" },
		]);
	});
});
