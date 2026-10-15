import type express from "express";
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { getTestApp } from "../helpers/test-setup";

describe("Health API Integration Tests", () => {
	let app: express.Application;

	beforeAll(async () => {
		app = await getTestApp();
	});

	it("GET /health returns healthy server and database status", async () => {
		const res = await request(app).get("/health");

		expect(res.status).toBe(200);
		expect(res.body).toMatchObject({
			success: true,
			data: {
				status: "healthy",
				database: {
					status: "connected",
					healthy: true,
				},
			},
		});
		expect(typeof res.body.data.uptime).toBe("number");
		expect(typeof res.body.data.timestamp).toBe("string");
	});

	it("GET /api/v1/health returns matching health payload under versioned prefix", async () => {
		const res = await request(app).get("/api/v1/health");

		expect(res.status).toBe(200);
		expect(res.body.success).toBe(true);
		expect(res.body.data.status).toBe("healthy");
		expect(res.body.data.database.healthy).toBe(true);
	});
});
