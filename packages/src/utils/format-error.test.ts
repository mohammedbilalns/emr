import { describe, expect, it } from "vitest";
import { formatFriendlyErrorMessage } from "./format-error";

describe("formatFriendlyErrorMessage", () => {
	it("formats raw min string error into clean sentence", () => {
		expect(
			formatFriendlyErrorMessage(
				"Too small: expected string to have >=2 characters",
			),
		).toBe("Must be at least 2 characters");
	});

	it("formats raw min string error with field name prefix", () => {
		expect(
			formatFriendlyErrorMessage(
				"Too small: expected string to have >=2 characters",
				"Physician name",
			),
		).toBe("Physician name must be at least 2 characters");
	});

	it("formats raw max string error into clean sentence", () => {
		expect(
			formatFriendlyErrorMessage(
				"Too big: expected string to have <=80 characters",
				"Department",
			),
		).toBe("Department cannot exceed 80 characters");
	});

	it("formats raw email error", () => {
		expect(formatFriendlyErrorMessage("Invalid email")).toBe(
			"Please enter a valid email address",
		);
		expect(formatFriendlyErrorMessage("Invalid email address")).toBe(
			"Please enter a valid email address",
		);
	});

	it("formats required field error", () => {
		expect(formatFriendlyErrorMessage("Required", "Password")).toBe(
			"Password is required",
		);
	});

	it("leaves already friendly custom messages unchanged", () => {
		expect(
			formatFriendlyErrorMessage(
				"Physician name must be at least 2 characters",
			),
		).toBe("Physician name must be at least 2 characters");
	});
});
