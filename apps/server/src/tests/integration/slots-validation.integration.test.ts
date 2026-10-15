import type express from "express";
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import {
	getAuthHeader,
	getTestApp,
	getTestDoctor,
} from "../helpers/test-setup";

describe("Slots & Input Validation Integration Tests", () => {
	let app: express.Application;
	let doctorId: string;

	beforeAll(async () => {
		app = await getTestApp();
		const doc = await getTestDoctor();
		doctorId = doc.id;
	});

	it("rejects unauthenticated slots request with 401 Unauthorized", async () => {
		const res = await request(app).get("/api/v1/slots");

		expect(res.status).toBe(401);
		expect(res.body.success).toBe(false);
	});

	it("rejects request missing doctorId query parameter with 400 Bad Request", async () => {
		const authHeader = await getAuthHeader("RECEPTIONIST");

		const res = await request(app)
			.get("/api/v1/slots?date=2026-10-20")
			.set("Authorization", authHeader.Authorization);

		expect(res.status).toBe(400);
		expect(res.body.success).toBe(false);
	});

	it("rejects invalid MongoDB ObjectId string for doctorId with 400 Bad Request", async () => {
		const authHeader = await getAuthHeader("RECEPTIONIST");

		const res = await request(app)
			.get("/api/v1/slots?doctorId=invalid-doc-id&date=2026-10-20")
			.set("Authorization", authHeader.Authorization);

		expect(res.status).toBe(400);
		expect(res.body.success).toBe(false);
	});

	it("rejects past dates with 400 Bad Request validation error", async () => {
		const authHeader = await getAuthHeader("RECEPTIONIST");

		const res = await request(app)
			.get(`/api/v1/slots?doctorId=${doctorId}&date=1995-05-12`)
			.set("Authorization", authHeader.Authorization);

		expect(res.status).toBe(400);
		expect(res.body.success).toBe(false);
		expect(res.body.message).toMatch(/past date/i);
	});

	it("returns slots array for valid doctor and future date with 200 OK", async () => {
		const authHeader = await getAuthHeader("RECEPTIONIST");
		const futureDate = new Date();
		futureDate.setDate(futureDate.getDate() + 3);
		const dateString = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, "0")}-${String(futureDate.getDate()).padStart(2, "0")}`;

		const res = await request(app)
			.get(`/api/v1/slots?doctorId=${doctorId}&date=${dateString}`)
			.set("Authorization", authHeader.Authorization);

		expect(res.status).toBe(200);
		expect(res.body.success).toBe(true);
		expect(Array.isArray(res.body.data)).toBe(true);
		if (res.body.data.length > 0) {
			expect(res.body.data[0]).toHaveProperty("startTime");
			expect(res.body.data[0]).toHaveProperty("endTime");
			expect(res.body.data[0]).toHaveProperty("status");
		}
	});
});
