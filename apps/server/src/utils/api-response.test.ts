import type { Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { sendSuccess } from "./api-response";

function createMockResponse() {
	const res: Partial<Response> = {};
	res.status = vi.fn().mockReturnValue(res);
	res.json = vi.fn().mockReturnValue(res);
	return res as Response;
}

describe("sendSuccess", () => {
	it("sends data when data is passed into the response", () => {
		const res = createMockResponse();
		const testData = { id: "123", name: "Dr. House" };

		sendSuccess(res, { data: testData, message: "Doctor retrieved" });

		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith({
			success: true,
			message: "Doctor retrieved",
			data: testData,
		});
	});

	it("omits data when null is passed into the response", () => {
		const res = createMockResponse();

		sendSuccess(res, { data: null, message: "Logged out successfully" });

		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith({
			success: true,
			message: "Logged out successfully",
		});
	});

	it("omits data when undefined is passed into the response", () => {
		const res = createMockResponse();

		sendSuccess(res, { data: undefined, message: "Operation completed" });

		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith({
			success: true,
			message: "Operation completed",
		});
	});

	it("omits data when data is not provided in options", () => {
		const res = createMockResponse();

		sendSuccess(res, { message: "Action succeeded" });

		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith({
			success: true,
			message: "Action succeeded",
		});
	});

	it("includes empty arrays and zero as valid data values", () => {
		const res = createMockResponse();

		sendSuccess(res, { data: [], message: "Empty list" });

		expect(res.json).toHaveBeenCalledWith({
			success: true,
			message: "Empty list",
			data: [],
		});
	});
});
