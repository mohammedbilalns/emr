import type { Role } from "@emr/shared";
import type express from "express";
import { createApp } from "../../app";
import { connectDatabase } from "../../config/db";
import { User } from "../../modules/auth";
import { Doctor } from "../../modules/doctors";
import { Patient } from "../../modules/patients";
import { signAccessToken } from "../../utils/jwt";

let cachedApp: express.Application | null = null;

/**
 * Returns a cached Express application instance for HTTP testing.
 */
export async function getTestApp(): Promise<express.Application> {
	await connectDatabase();
	if (!cachedApp) {
		cachedApp = createApp();
	}
	return cachedApp;
}

/**
 * Generates an Authorization header with a signed JWT token for the requested user role.
 */
export async function getAuthHeader(
	role: Role,
): Promise<{ Authorization: string }> {
	await connectDatabase();
	const user = await User.findOne({ role, isActive: true });
	if (!user) {
		throw new Error(
			`No active user with role "${role}" found in database. Please seed the database first.`,
		);
	}

	const token = signAccessToken({
		sub: user._id.toString(),
		role: user.role,
		email: user.email,
	});

	return { Authorization: `Bearer ${token}` };
}

/**
 * Retrieves the first active physician document ID.
 */
export async function getTestDoctor(): Promise<{
	id: string;
	name: string;
	department: string;
	slotDuration: number;
}> {
	await connectDatabase();
	const doctor = await Doctor.findOne({ isActive: true });
	if (!doctor) {
		throw new Error("No active doctor found in database.");
	}

	return {
		id: doctor._id.toString(),
		name: doctor.name,
		department: doctor.department,
		slotDuration: doctor.schedule.slotDuration,
	};
}

/**
 * Retrieves an active patient document ID.
 */
export async function getTestPatient(): Promise<{
	id: string;
	name: string;
	patientCode: string;
	mobile: string;
}> {
	await connectDatabase();
	const patient = await Patient.findOne();
	if (!patient) {
		throw new Error("No patient found in database.");
	}

	return {
		id: patient._id.toString(),
		name: patient.name,
		patientCode: patient.patientCode,
		mobile: patient.mobile,
	};
}
