import type express from "express";
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { getAuthHeader, getTestApp } from "../helpers/test-setup";

describe("Authentication API Integration Tests", () => {
	let app: express.Application;

	beforeAll(async () => {
		app = await getTestApp();
	});

	describe("POST /api/v1/auth/login", () => {
		it("authenticates valid credentials, returns tokens and sets HttpOnly cookie", async () => {
			const res = await request(app).post("/api/v1/auth/login").send({
				email: "receptionist@emr.local",
				password: "Recept@12345",
			});

			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);
			expect(res.body.data.user).toMatchObject({
				email: "receptionist@emr.local",
				role: "RECEPTIONIST",
			});
			expect(typeof res.body.data.accessToken).toBe("string");

			// Verify cookie attributes
			const cookieHeader = res.headers["set-cookie"];
			const cookies = Array.isArray(cookieHeader)
				? cookieHeader
				: typeof cookieHeader === "string"
					? [cookieHeader]
					: [];
			expect(cookies.length).toBeGreaterThan(0);
			const refreshCookie = cookies.find((c) => c.startsWith("emr_rt="));
			expect(refreshCookie).toBeDefined();
			expect(refreshCookie).toContain("HttpOnly");
			expect(refreshCookie).toContain("Path=/api/v1/auth");
		});

		it("rejects invalid password with 401 Unauthorized", async () => {
			const res = await request(app).post("/api/v1/auth/login").send({
				email: "receptionist@emr.local",
				password: "WrongPassword999",
			});

			expect(res.status).toBe(401);
			expect(res.body.success).toBe(false);
			expect(res.body.message).toMatch(/invalid email or password/i);
		});

		it("rejects malformed email format with 400 Bad Request", async () => {
			const res = await request(app).post("/api/v1/auth/login").send({
				email: "not-an-email",
				password: "Recept@12345",
			});

			expect(res.status).toBe(400);
			expect(res.body.success).toBe(false);
			expect(Array.isArray(res.body.errors)).toBe(true);
		});
	});

	describe("POST /api/v1/auth/refresh", () => {
		it("rotates refresh token and issues new access token with valid cookie", async () => {
			// Login first to get a valid cookie
			const loginRes = await request(app).post("/api/v1/auth/login").send({
				email: "sarah.chen@emr.local",
				password: "Doctor@12345",
			});

			const cookieHeader = loginRes.headers["set-cookie"];
			const cookies = Array.isArray(cookieHeader)
				? cookieHeader
				: typeof cookieHeader === "string"
					? [cookieHeader]
					: [];

			const refreshRes = await request(app)
				.post("/api/v1/auth/refresh")
				.set("Cookie", cookies);

			expect(refreshRes.status).toBe(200);
			expect(refreshRes.body.success).toBe(true);
			expect(typeof refreshRes.body.data.accessToken).toBe("string");

			// Rotated new cookie returned
			const newCookies = refreshRes.headers["set-cookie"];
			expect(newCookies).toBeDefined();
		});

		it("rejects request without refresh cookie with 401 Unauthorized", async () => {
			const res = await request(app).post("/api/v1/auth/refresh");

			expect(res.status).toBe(401);
			expect(res.body.success).toBe(false);
		});

		it("rejects forged refresh cookie with 401 Unauthorized", async () => {
			const res = await request(app)
				.post("/api/v1/auth/refresh")
				.set("Cookie", [
					"emr_rt=forged.invalid.token; Path=/api/v1/auth; HttpOnly",
				]);

			expect(res.status).toBe(401);
			expect(res.body.success).toBe(false);
		});
	});

	describe("GET /api/v1/auth/me", () => {
		it("returns current user profile with valid Bearer token", async () => {
			const authHeader = await getAuthHeader("SUPER_ADMIN");

			const res = await request(app)
				.get("/api/v1/auth/me")
				.set("Authorization", authHeader.Authorization);

			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);
			expect(res.body.data.role).toBe("SUPER_ADMIN");
			expect(res.body.data.email).toBe("admin@emr.local");
		});

		it("rejects unauthenticated request with 401 Unauthorized", async () => {
			const res = await request(app).get("/api/v1/auth/me");

			expect(res.status).toBe(401);
			expect(res.body.success).toBe(false);
		});

		it("rejects tampered Bearer token with 401 Unauthorized", async () => {
			const res = await request(app)
				.get("/api/v1/auth/me")
				.set("Authorization", "Bearer invalid.jwt.token");

			expect(res.status).toBe(401);
			expect(res.body.success).toBe(false);
		});
	});
});
