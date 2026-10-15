import type express from "express";
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import {
	getAuthHeader,
	getTestApp,
	getTestPatient,
} from "../helpers/test-setup";

describe("Patient Search API Integration Tests", () => {
	let app: express.Application;
	let receptionistHeader: { Authorization: string };
	let doctorHeader: { Authorization: string };
	let seededPatient: {
		id: string;
		name: string;
		patientCode: string;
		mobile: string;
	};

	beforeAll(async () => {
		app = await getTestApp();
		receptionistHeader = await getAuthHeader("RECEPTIONIST");
		doctorHeader = await getAuthHeader("DOCTOR");
		seededPatient = await getTestPatient();
	});

	it("rejects unauthenticated search requests with 401 Unauthorized", async () => {
		const res = await request(app).get("/api/v1/patients/search?q=Alice");

		expect(res.status).toBe(401);
		expect(res.body.success).toBe(false);
	});

	it("forbids Doctor role from searching patient directory directly with 403", async () => {
		const res = await request(app)
			.get("/api/v1/patients/search?q=Alice")
			.set("Authorization", doctorHeader.Authorization);

		expect(res.status).toBe(403);
		expect(res.body.success).toBe(false);
	});

	it("rejects empty query parameter with 400 Bad Request", async () => {
		const res = await request(app)
			.get("/api/v1/patients/search?q=")
			.set("Authorization", receptionistHeader.Authorization);

		expect(res.status).toBe(400);
		expect(res.body.success).toBe(false);
	});

	it("finds patient by name prefix", async () => {
		const prefix = seededPatient.name.slice(0, 4);

		const res = await request(app)
			.get(`/api/v1/patients/search?q=${encodeURIComponent(prefix)}`)
			.set("Authorization", receptionistHeader.Authorization);

		expect(res.status).toBe(200);
		expect(res.body.success).toBe(true);
		expect(Array.isArray(res.body.data)).toBe(true);

		const found = res.body.data.some(
			(p: { id: string }) => p.id === seededPatient.id,
		);
		expect(found).toBe(true);
	});

	it("finds patient by patientCode prefix (case-insensitive)", async () => {
		const codeQuery = seededPatient.patientCode.toLowerCase();

		const res = await request(app)
			.get(`/api/v1/patients/search?q=${codeQuery}`)
			.set("Authorization", receptionistHeader.Authorization);

		expect(res.status).toBe(200);
		expect(res.body.success).toBe(true);
		expect(res.body.data.length).toBeGreaterThan(0);
		expect(res.body.data[0].patientCode).toBe(seededPatient.patientCode);
	});

	it("finds patient by mobile number prefix", async () => {
		const mobilePrefix = seededPatient.mobile.slice(0, 6);

		const res = await request(app)
			.get(`/api/v1/patients/search?q=${mobilePrefix}`)
			.set("Authorization", receptionistHeader.Authorization);

		expect(res.status).toBe(200);
		expect(res.body.success).toBe(true);
		expect(res.body.data.length).toBeGreaterThan(0);
		expect(res.body.data[0].mobile).toBe(seededPatient.mobile);
	});

	it("handles special regex characters safely without crashing", async () => {
		const res = await request(app)
			.get("/api/v1/patients/search?q=%5B%5E%24%2E%2A%2B%3F%28%29%5D") // [^$.*+?()]
			.set("Authorization", receptionistHeader.Authorization);

		expect(res.status).toBe(200);
		expect(res.body.success).toBe(true);
		expect(res.body.data).toEqual([]);
	});
});
