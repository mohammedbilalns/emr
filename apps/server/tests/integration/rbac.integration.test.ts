import type express from "express";
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { getAuthHeader, getTestApp } from "../helpers/test-setup";

describe("RBAC & Route Security Integration Tests", () => {
	let app: express.Application;

	beforeAll(async () => {
		app = await getTestApp();
	});

	describe("Physician Provisioning (POST /api/v1/doctors)", () => {
		it("denies access to unauthenticated requests with 401", async () => {
			const res = await request(app).post("/api/v1/doctors").send({});

			expect(res.status).toBe(401);
			expect(res.body.success).toBe(false);
		});

		it("denies access to Receptionist role with 403 Forbidden", async () => {
			const authHeader = await getAuthHeader("RECEPTIONIST");

			const res = await request(app)
				.post("/api/v1/doctors")
				.set("Authorization", authHeader.Authorization)
				.send({});

			expect(res.status).toBe(403);
			expect(res.body.success).toBe(false);
			expect(res.body.message).toMatch(/permission/i);
		});

		it("denies access to Doctor role with 403 Forbidden", async () => {
			const authHeader = await getAuthHeader("DOCTOR");

			const res = await request(app)
				.post("/api/v1/doctors")
				.set("Authorization", authHeader.Authorization)
				.send({});

			expect(res.status).toBe(403);
			expect(res.body.success).toBe(false);
		});

		it("allows Super Admin through RBAC check", async () => {
			const authHeader = await getAuthHeader("SUPER_ADMIN");

			const res = await request(app)
				.post("/api/v1/doctors")
				.set("Authorization", authHeader.Authorization)
				.send({});

			// Should fail with 400 Validation Error because body is empty, proving it passed 401 & 403
			expect(res.status).toBe(400);
			expect(res.body.success).toBe(false);
			expect(Array.isArray(res.body.errors)).toBe(true);
		});
	});

	describe("Staff Provisioning (POST /api/v1/staff/receptionists)", () => {
		it("denies Receptionist from creating new staff accounts with 403", async () => {
			const authHeader = await getAuthHeader("RECEPTIONIST");

			const res = await request(app)
				.post("/api/v1/staff/receptionists")
				.set("Authorization", authHeader.Authorization)
				.send({});

			expect(res.status).toBe(403);
		});

		it("denies Doctor from creating new staff accounts with 403", async () => {
			const authHeader = await getAuthHeader("DOCTOR");

			const res = await request(app)
				.post("/api/v1/staff/receptionists")
				.set("Authorization", authHeader.Authorization)
				.send({});

			expect(res.status).toBe(403);
		});
	});

	describe("Staff Directory (GET /api/v1/staff/receptionists)", () => {
		it("denies Receptionist from viewing staff directory with 403", async () => {
			const authHeader = await getAuthHeader("RECEPTIONIST");

			const res = await request(app)
				.get("/api/v1/staff/receptionists")
				.set("Authorization", authHeader.Authorization);

			expect(res.status).toBe(403);
		});

		it("denies Doctor from viewing staff directory with 403", async () => {
			const authHeader = await getAuthHeader("DOCTOR");

			const res = await request(app)
				.get("/api/v1/staff/receptionists")
				.set("Authorization", authHeader.Authorization);

			expect(res.status).toBe(403);
		});

		it("allows Super Admin to view staff directory with 200", async () => {
			const authHeader = await getAuthHeader("SUPER_ADMIN");

			const res = await request(app)
				.get("/api/v1/staff/receptionists")
				.set("Authorization", authHeader.Authorization);

			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);
			expect(Array.isArray(res.body.data)).toBe(true);
		});
	});

	describe("Clinical Lifecycle Boundaries", () => {
		const dummyId = "507f1f77bcf86cd799439011";

		it("forbids Doctors from booking appointments directly via POST /api/v1/appointments", async () => {
			const authHeader = await getAuthHeader("DOCTOR");

			const res = await request(app)
				.post("/api/v1/appointments")
				.set("Authorization", authHeader.Authorization)
				.send({});

			expect(res.status).toBe(403);
			expect(res.body.success).toBe(false);
		});

		it("forbids Doctors from marking patients arrived via POST /api/v1/appointments/:id/arrive", async () => {
			const authHeader = await getAuthHeader("DOCTOR");

			const res = await request(app)
				.post(`/api/v1/appointments/${dummyId}/arrive`)
				.set("Authorization", authHeader.Authorization);

			expect(res.status).toBe(403);
			expect(res.body.success).toBe(false);
		});

		it("forbids Receptionists from completing consultations via POST /api/v1/appointments/:id/complete", async () => {
			const authHeader = await getAuthHeader("RECEPTIONIST");

			const res = await request(app)
				.post(`/api/v1/appointments/${dummyId}/complete`)
				.set("Authorization", authHeader.Authorization);

			expect(res.status).toBe(403);
			expect(res.body.success).toBe(false);
		});
	});

	describe("Department Listing (GET /api/v1/departments)", () => {
		it("denies access to unauthenticated requests with 401", async () => {
			const res = await request(app).get("/api/v1/departments");
			expect(res.status).toBe(401);
		});

		it("allows authenticated users to fetch departments", async () => {
			const authHeader = await getAuthHeader("SUPER_ADMIN");
			const res = await request(app)
				.get("/api/v1/departments")
				.set("Authorization", authHeader.Authorization);

			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);
			expect(Array.isArray(res.body.data)).toBe(true);
			expect(res.body.data.length).toBeGreaterThan(0);
			expect(res.body.data[0]).toHaveProperty("name");
			expect(res.body.data[0]).toHaveProperty("id");
		});
	});
});
