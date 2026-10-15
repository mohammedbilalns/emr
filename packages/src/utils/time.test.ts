import { describe, expect, it } from "vitest";
import { fromMinutes, toMinutes } from "./time";

describe("Time Utility Functions", () => {
	describe("toMinutes", () => {
		it("converts midnight 00:00 to 0", () => {
			expect(toMinutes("00:00")).toBe(0);
		});

		it("converts morning consultation hours to minutes", () => {
			expect(toMinutes("09:00")).toBe(540);
			expect(toMinutes("09:15")).toBe(555);
			expect(toMinutes("09:45")).toBe(585);
		});

		it("converts afternoon and evening hours", () => {
			expect(toMinutes("12:00")).toBe(720);
			expect(toMinutes("13:30")).toBe(810);
			expect(toMinutes("17:00")).toBe(1020);
			expect(toMinutes("23:59")).toBe(1439);
		});
	});

	describe("fromMinutes", () => {
		it("converts 0 to midnight 00:00 with zero padding", () => {
			expect(fromMinutes(0)).toBe("00:00");
		});

		it("formats morning minutes into padded HH:mm string", () => {
			expect(fromMinutes(540)).toBe("09:00");
			expect(fromMinutes(555)).toBe("09:15");
			expect(fromMinutes(585)).toBe("09:45");
		});

		it("formats afternoon minutes into padded HH:mm string", () => {
			expect(fromMinutes(720)).toBe("12:00");
			expect(fromMinutes(810)).toBe("13:30");
			expect(fromMinutes(1020)).toBe("17:00");
			expect(fromMinutes(1439)).toBe("23:59");
		});
	});

	describe("Round-trip Invertibility", () => {
		it("preserves exact representation across toMinutes and fromMinutes", () => {
			const samples = ["00:00", "08:15", "09:30", "12:00", "15:45", "23:59"];
			for (const sample of samples) {
				expect(fromMinutes(toMinutes(sample))).toBe(sample);
			}
		});
	});
});
