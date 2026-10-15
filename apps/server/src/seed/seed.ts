import bcrypt from "bcryptjs";
import { connectDatabase, disconnectDatabase } from "../config/db";
import logger from "../logging/logger";
import { Counter } from "../models/counter.model";
import { Doctor } from "../models/doctor.model";
import { Patient } from "../models/patient.model";
import { User } from "../models/user.model";

const receptionist = {
	name: "Amy Pond",
	email: "receptionist@emr.local",
	password: "Recept@12345",
};

const doctors = [
	{
		name: "Dr. Sarah Chen",
		email: "sarah.chen@emr.local",
		password: "Doctor@12345",
		department: "Cardiology",
		schedule: {
			workingDays: [1, 2, 3, 4, 5],
			sessions: [
				{ start: "09:00", end: "12:00" },
				{ start: "13:00", end: "17:00" },
			],
			breaks: [{ start: "12:00", end: "13:00" }], // matches the assessment's example layout
			slotDuration: 15,
		},
	},
	{
		name: "Dr. James Wilson",
		email: "james.wilson@emr.local",
		password: "Doctor@12345",
		department: "Neurology",
		schedule: {
			workingDays: [1, 2, 3, 4, 5, 6],
			sessions: [{ start: "09:00", end: "13:00" }],
			breaks: [{ start: "10:30", end: "10:45" }], // break INSIDE a session — proves the filter
			slotDuration: 30,
		},
	},
];

const patients = [
	{
		patientCode: "P000001",
		name: "Alice Johnson",
		mobile: "9876543201",
		gender: "FEMALE" as const,
		dateOfBirth: "1990-05-15",
	},
	{
		patientCode: "P000002",
		name: "Bob Smith",
		mobile: "9876543202",
		gender: "MALE" as const,
		dateOfBirth: "1985-08-22",
	},
	{
		patientCode: "P000003",
		name: "Charlie Brown",
		mobile: "9876543203",
		gender: "OTHER" as const,
		dateOfBirth: "1995-12-10",
	},
];

async function seed(): Promise<void> {
	await connectDatabase();

	// 1. Super Admin
	const adminEmail = process.env.SUPER_ADMIN_EMAIL ?? "admin@emr.local";
	const adminPassword = process.env.SUPER_ADMIN_PASSWORD ?? "Admin@12345";
	const adminPasswordHash = await bcrypt.hash(adminPassword, 12);

	await User.findOneAndUpdate(
		{ email: adminEmail },
		{
			name: "Super Admin",
			email: adminEmail,
			passwordHash: adminPasswordHash,
			role: "SUPER_ADMIN",
			isActive: true,
		},
		{ upsert: true, setDefaultsOnInsert: true },
	);

	// 2. Receptionist
	const receptPasswordHash = await bcrypt.hash(receptionist.password, 12);
	await User.findOneAndUpdate(
		{ email: receptionist.email },
		{
			name: receptionist.name,
			email: receptionist.email,
			passwordHash: receptPasswordHash,
			role: "RECEPTIONIST",
			isActive: true,
		},
		{ upsert: true, setDefaultsOnInsert: true },
	);

	// 3. Doctors
	for (const doc of doctors) {
		const docPasswordHash = await bcrypt.hash(doc.password, 12);
		const user = await User.findOneAndUpdate(
			{ email: doc.email },
			{
				name: doc.name,
				email: doc.email,
				passwordHash: docPasswordHash,
				role: "DOCTOR",
				isActive: true,
			},
			{ upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
		);

		await Doctor.findOneAndUpdate(
			{ user: user._id },
			{
				user: user._id,
				name: doc.name,
				department: doc.department,
				schedule: doc.schedule,
				isActive: true,
			},
			{ upsert: true, setDefaultsOnInsert: true },
		);
	}

	// 4. Patients
	for (const p of patients) {
		await Patient.findOneAndUpdate(
			{ mobile: p.mobile },
			{
				patientCode: p.patientCode,
				name: p.name,
				mobile: p.mobile,
				gender: p.gender,
				dateOfBirth: p.dateOfBirth,
			},
			{ upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
		);
	}

	// Sync counter sequence to ensure nextPatientCode doesn't collide
	await Counter.findOneAndUpdate(
		{ _id: "patient" },
		{ $max: { seq: 3 } },
		{ upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
	);

	logger.info("Database seed completed successfully.");
	logger.info(`Super admin:  ${adminEmail} / ${adminPassword}`);
	logger.info(`Receptionist: ${receptionist.email} / ${receptionist.password}`);
	for (const doc of doctors) {
		logger.info(`Doctor (${doc.department}): ${doc.email} / ${doc.password}`);
	}
	for (const p of patients) {
		logger.info(`Patient: ${p.patientCode} - ${p.name} (${p.mobile})`);
	}

	await disconnectDatabase();
}

void seed().catch((error) => {
	logger.error({ error }, "Seed failed");
	process.exit(1);
});
