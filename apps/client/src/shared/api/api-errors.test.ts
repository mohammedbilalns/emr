import { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, it } from "vitest";
import { ApiClientError, getErrorMessage, normalizeError } from "./api-errors";

describe("api-errors utilities", () => {
	describe("ApiClientError", () => {
		it("constructs with status code and field errors", () => {
			const err = new ApiClientError("Validation failed", 400, [
				{ path: "mobile", message: "Mobile is invalid" },
			]);
			expect(err.message).toBe("Validation failed");
			expect(err.statusCode).toBe(400);
			expect(err.fieldErrors).toEqual([
				{ path: "mobile", message: "Mobile is invalid" },
			]);
			expect(err.name).toBe("ApiClientError");
		});
	});

	describe("normalizeError", () => {
		it("returns ApiClientError instances untouched", () => {
			const original = new ApiClientError("Original error", 404);
			const normalized = normalizeError(original);
			expect(normalized).toBe(original);
		});

		it("normalizes standard JS Error into ApiClientError", () => {
			const jsErr = new Error("Generic failure");
			const normalized = normalizeError(jsErr);
			expect(normalized).toBeInstanceOf(ApiClientError);
			expect(normalized.message).toBe("Generic failure");
			expect(normalized.statusCode).toBeUndefined();
		});

		it("normalizes Axios error with structured API error payload", () => {
			const axiosErr = new AxiosError(
				"Request failed with status code 422",
				"ERR_BAD_REQUEST",
				undefined,
				undefined,
				{
					status: 422,
					statusText: "Unprocessable Entity",
					headers: {},
					config: { headers: new AxiosHeaders() },
					data: {
						success: false,
						message: "Validation failed",
						errors: [{ path: "email", message: "Invalid email address" }],
					},
				},
			);

			const normalized = normalizeError(axiosErr);
			expect(normalized.statusCode).toBe(422);
			expect(normalized.message).toBe("Validation failed");
			expect(normalized.fieldErrors).toEqual([
				{ path: "email", message: "Invalid email address" },
			]);
		});

		it("handles non-error unknown values safely", () => {
			const normalized = normalizeError("string exception");
			expect(normalized.message).toBe("An unexpected error occurred");
		});
	});

	describe("getErrorMessage", () => {
		it("extracts message from error object", () => {
			expect(getErrorMessage(new Error("Database disconnected"))).toBe(
				"Database disconnected",
			);
		});

		it("falls back to default message when error is falsy", () => {
			expect(getErrorMessage(null, "Custom fallback")).toBe("Custom fallback");
		});
	});
});
