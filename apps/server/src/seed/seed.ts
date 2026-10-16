import { connectDatabase, disconnectDatabase } from "../config/db";
import logger from "../logging/logger";
import { Appointment } from "../modules/appointments";
import { User } from "../modules/auth";
import { Department, migrateDoctorDepartments } from "../modules/departments";
import { Doctor } from "../modules/doctors";
import { Counter, Patient } from "../modules/patients";
import { hashPassword } from "../utils/hash";

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

	try {
		const adminEmail = process.env.SUPER_ADMIN_EMAIL ?? "admin@emr.local";
		const adminPassword = process.env.SUPER_ADMIN_PASSWORD ?? "Admin@12345";

		await Promise.all([
			(async () => {
				const adminPasswordHash = await hashPassword(adminPassword);
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
			})(),
			(async () => {
				const receptPasswordHash = await hashPassword(receptionist.password);
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
			})(),
		]);

		await Promise.all(
			doctors.map(async (doc) => {
				const docPasswordHash = await hashPassword(doc.password);
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
			}),
		);

		await Promise.all(
			Array.from(new Set(doctors.map((d) => d.department))).map((deptName) =>
				Department.findOneAndUpdate(
					{ nameNormalized: deptName.trim().toLowerCase() },
					{
						name: deptName.trim(),
						nameNormalized: deptName.trim().toLowerCase(),
						isActive: true,
					},
					{ upsert: true, setDefaultsOnInsert: true },
				),
			),
		);

		await migrateDoctorDepartments();

		await Promise.all([
			...patients.map((p) =>
				Patient.findOneAndUpdate(
					{ mobile: p.mobile },
					{
						patientCode: p.patientCode,
						name: p.name,
						mobile: p.mobile,
						gender: p.gender,
						dateOfBirth: p.dateOfBirth,
					},
					{ upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
				),
			),
			// Sync counter sequence to ensure nextPatientCode doesn't collide
			Counter.findOneAndUpdate(
				{ _id: "patient" },
				{ $max: { seq: 3 } },
				{ upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
			),
		]);

		const [adminUser, drChenDoc, drWilsonDoc, alice, bob, charlie] =
			await Promise.all([
				User.findOne({ email: adminEmail }),
				Doctor.findOne({ name: "Dr. Sarah Chen" }),
				Doctor.findOne({ name: "Dr. James Wilson" }),
				Patient.findOne({ patientCode: "P000001" }),
				Patient.findOne({ patientCode: "P000002" }),
				Patient.findOne({ patientCode: "P000003" }),
			]);

		const d = new Date();
		d.setDate(d.getDate() + 1);
		if (d.getDay() === 0) d.setDate(d.getDate() + 1); // skip Sunday
		const apptDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

		const appointmentTasks: Promise<unknown>[] = [];

		// Reset existing appointments so seed runs produce a clean, predictable schedule
		await Appointment.deleteMany({});

		if (drChenDoc && alice && adminUser) {
			appointmentTasks.push(
				Appointment.findOneAndUpdate(
					{
						doctor: drChenDoc._id,
						date: apptDate,
						startTime: "09:00",
						active: true,
					},
					{
						doctor: drChenDoc._id,
						doctorName: drChenDoc.name,
						patient: alice._id,
						patientCode: alice.patientCode,
						patientName: alice.name,
						patientMobile: alice.mobile,
						department: drChenDoc.department,
						date: apptDate,
						startTime: "09:00",
						endTime: "09:15",
						status: "SCHEDULED",
						purpose: "Cardiology consultation",
						active: true,
						createdBy: adminUser._id,
					},
					{ upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
				),
			);
		}

		if (drChenDoc && bob && adminUser) {
			appointmentTasks.push(
				Appointment.findOneAndUpdate(
					{
						doctor: drChenDoc._id,
						date: apptDate,
						startTime: "09:15",
						active: true,
					},
					{
						doctor: drChenDoc._id,
						doctorName: drChenDoc.name,
						patient: bob._id,
						patientCode: bob.patientCode,
						patientName: bob.name,
						patientMobile: bob.mobile,
						department: drChenDoc.department,
						date: apptDate,
						startTime: "09:15",
						endTime: "09:30",
						status: "ARRIVED",
						purpose: "Routine checkup",
						active: true,
						createdBy: adminUser._id,
					},
					{ upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
				),
			);
		}

		if (drWilsonDoc && charlie && adminUser) {
			appointmentTasks.push(
				Appointment.findOneAndUpdate(
					{
						doctor: drWilsonDoc._id,
						date: apptDate,
						startTime: "09:00",
						active: true,
					},
					{
						doctor: drWilsonDoc._id,
						doctorName: drWilsonDoc.name,
						patient: charlie._id,
						patientCode: charlie.patientCode,
						patientName: charlie.name,
						patientMobile: charlie.mobile,
						department: drWilsonDoc.department,
						date: apptDate,
						startTime: "09:00",
						endTime: "09:30",
						status: "SCHEDULED",
						purpose: "Migraine follow-up",
						active: true,
						createdBy: adminUser._id,
					},
					{ upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
				),
			);
		}

		await Promise.all(appointmentTasks);

		logger.info("Database seed completed successfully.");
		logger.info(`Super admin:  ${adminEmail} / ${adminPassword}`);
		logger.info(
			`Receptionist: ${receptionist.email} / ${receptionist.password}`,
		);
		for (const doc of doctors) {
			logger.info(`Doctor (${doc.department}): ${doc.email} / ${doc.password}`);
		}
		for (const p of patients) {
			logger.info(`Patient: ${p.patientCode} - ${p.name} (${p.mobile})`);
		}
	} finally {
		await disconnectDatabase();
	}
}

void seed().catch((error) => {
	logger.error({ error }, "Seed failed");
	process.exit(1);
});
