import type express from "express";
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { Appointment } from "../../modules/appointments";
import { Doctor } from "../../modules/doctors";
import {
	getAuthHeader,
	getTestApp,
	getTestPatient,
} from "../helpers/test-setup";

describe("Concurrency & Appointment State Machine Integration Tests", () => {
	let app: express.Application;
	let doctorId: string;
	let receptionistHeader: { Authorization: string };
	let doctorHeader: { Authorization: string };
	let testDate: string;

	beforeAll(async () => {
		app = await getTestApp();
		receptionistHeader = await getAuthHeader("RECEPTIONIST");
		doctorHeader = await getAuthHeader("DOCTOR");

		// Find Dr. Sarah Chen (Cardiology)
		const doctor = await Doctor.findOne({ name: "Dr. Sarah Chen" });
		if (!doctor) throw new Error("Dr. Sarah Chen not found in database.");
		doctorId = doctor._id.toString();

		// Calculate a future Monday (day index 1, guaranteed to be a working day)
		const d = new Date();
		const day = d.getDay();
		const diff = (8 - day) % 7 || 7;
		d.setDate(d.getDate() + diff + 7); // Monday two weeks ahead to avoid any seed collisions
		testDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

		// Clean up any test appointments on this slot before starting
		await Appointment.deleteMany({ doctor: doctor._id, date: testDate });
	});

	it("prevents double-booking via partial unique index under concurrent requests", async () => {
		const targetSlot = "09:00";

		const mobileA = String(Math.floor(1000000000 + Math.random() * 9000000000));
		const mobileB = String(Math.floor(1000000000 + Math.random() * 9000000000));

		const bookingPayloadA = {
			doctorId,
			date: testDate,
			startTime: targetSlot,
			patient: {
				type: "NEW",
				name: "Concurrent Patient A",
				mobile: mobileA,
				gender: "FEMALE",
			},
			purpose: "Cardiac checkup A",
		};

		const bookingPayloadB = {
			doctorId,
			date: testDate,
			startTime: targetSlot,
			patient: {
				type: "NEW",
				name: "Concurrent Patient B",
				mobile: mobileB,
				gender: "MALE",
			},
			purpose: "Cardiac checkup B",
		};

		// Fire both booking requests concurrently at the same microsecond
		const [resA, resB] = await Promise.all([
			request(app)
				.post("/api/v1/appointments")
				.set("Authorization", receptionistHeader.Authorization)
				.send(bookingPayloadA),
			request(app)
				.post("/api/v1/appointments")
				.set("Authorization", receptionistHeader.Authorization)
				.send(bookingPayloadB),
		]);

		const statuses = [resA.status, resB.status].sort();

		// Exactly one request MUST succeed (201) and the other MUST conflict (409)
		expect(statuses).toEqual([201, 409]);

		const conflictRes = resA.status === 409 ? resA : resB;
		expect(conflictRes.body.success).toBe(false);
		expect(conflictRes.body.message).toMatch(/booked by someone else/i);
	});

	it("prevents registering multiple new patients with duplicate mobile numbers", async () => {
		const existingPatient = await getTestPatient();

		const res = await request(app)
			.post("/api/v1/appointments")
			.set("Authorization", receptionistHeader.Authorization)
			.send({
				doctorId,
				date: testDate,
				startTime: "11:00",
				patient: {
					type: "NEW",
					name: "Imposter Patient",
					mobile: existingPatient.mobile, // Duplicate mobile number
					gender: "MALE",
				},
				purpose: "Follow-up",
			});

		expect(res.status).toBe(409);
		expect(res.body.success).toBe(false);
		expect(res.body.message).toMatch(/already exists/i);
	});

	it("enforces strict lifecycle status state machine transitions", async () => {
		// Book an appointment at 11:15
		const bookingRes = await request(app)
			.post("/api/v1/appointments")
			.set("Authorization", receptionistHeader.Authorization)
			.send({
				doctorId,
				date: testDate,
				startTime: "11:15",
				patient: {
					type: "NEW",
					name: "Lifecycle Patient",
					mobile: String(Math.floor(1000000000 + Math.random() * 9000000000)),
					gender: "FEMALE",
				},
				purpose: "General consultation",
			});

		expect(bookingRes.status).toBe(201);
		const appointmentId = bookingRes.body.data.id;

		// 1. Invalid Transition: Try to COMPLETE appointment directly from SCHEDULED (must be ARRIVED first)
		const directCompleteRes = await request(app)
			.post(`/api/v1/appointments/${appointmentId}/complete`)
			.set("Authorization", doctorHeader.Authorization);

		expect(directCompleteRes.status).toBe(422);
		expect(directCompleteRes.body.success).toBe(false);
		expect(directCompleteRes.body.message).toMatch(
			/Cannot transition appointment from SCHEDULED to COMPLETED/i,
		);

		// 2. Valid Transition: Mark patient as ARRIVED
		const arriveRes = await request(app)
			.post(`/api/v1/appointments/${appointmentId}/arrive`)
			.set("Authorization", receptionistHeader.Authorization);

		expect(arriveRes.status).toBe(200);
		expect(arriveRes.body.data.status).toBe("ARRIVED");

		// 3. Invalid Transition: Try to mark ARRIVED again
		const secondArriveRes = await request(app)
			.post(`/api/v1/appointments/${appointmentId}/arrive`)
			.set("Authorization", receptionistHeader.Authorization);

		expect(secondArriveRes.status).toBe(422);
		expect(secondArriveRes.body.message).toMatch(
			/Cannot transition appointment from ARRIVED to ARRIVED/i,
		);

		// 4. Valid Transition: Doctor completes consultation
		const completeRes = await request(app)
			.post(`/api/v1/appointments/${appointmentId}/complete`)
			.set("Authorization", doctorHeader.Authorization);

		expect(completeRes.status).toBe(200);
		expect(completeRes.body.data.status).toBe("COMPLETED");

		// 5. Invalid Transition: Cannot cancel a COMPLETED appointment
		const cancelRes = await request(app)
			.delete(`/api/v1/appointments/${appointmentId}`)
			.set("Authorization", receptionistHeader.Authorization);

		expect(cancelRes.status).toBe(422);
		expect(cancelRes.body.message).toMatch(
			/Cannot transition appointment from COMPLETED to CANCELLED/i,
		);
	});
});
