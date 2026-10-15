import type { Response } from "express";
import { describe, expect, it, vi } from "vitest";
import * as db from "../../config/db";
import { healthHandler } from "./health.controller";

function createMockResponse() {
	const res: Partial<Response> = {};
	res.status = vi.fn().mockReturnValue(res);
	res.json = vi.fn().mockReturnValue(res);
	return res as Response;
}

describe("healthHandler", () => {
	it("returns 200 and healthy payload when database is healthy", async () => {
		vi.spyOn(db, "getDatabaseHealth").mockResolvedValueOnce({
			status: "connected",
			healthy: true,
			latencyMs: 2,
		});

		const req = {} as never;
		const res = createMockResponse();

		await healthHandler(req, res);

		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith(
			expect.objectContaining({
				success: true,
				message: "Service is healthy",
				data: expect.objectContaining({
					status: "healthy",
					database: expect.objectContaining({ healthy: true }),
				}),
			}),
		);
	});

	it("returns 500 when database is unhealthy", async () => {
		vi.spyOn(db, "getDatabaseHealth").mockResolvedValueOnce({
			status: "disconnected",
			healthy: false,
		});

		const req = {} as never;
		const res = createMockResponse();

		await healthHandler(req, res);

		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.json).toHaveBeenCalledWith(
			expect.objectContaining({
				success: false,
				message: "Service degraded: database disconnected",
				data: expect.objectContaining({
					status: "unhealthy",
				}),
			}),
		);
	});
});
