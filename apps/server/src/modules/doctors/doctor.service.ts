import type {
	AuthUser,
	CreateDoctorBody,
	CreateStaffBody,
	DoctorDto,
	StaffDto,
	UpdateDoctorBody,
} from "@emr/shared";
import { AUDIT_ACTIONS } from "../../config/constants";
import { ConflictError, NotFoundError } from "../../errors/base.error";
import { audit } from "../audit";
import { User } from "../auth";
import { toDoctorDto } from "./doctor.mapper";
import { Doctor } from "./doctor.model";

/**
 * Creates a doctor user account and clinical profile with compensating rollback on failure.
 */
export async function createDoctor(
	body: CreateDoctorBody,
	actor: AuthUser,
): Promise<DoctorDto> {
	if (await User.exists({ email: body.email })) {
		throw new ConflictError("A user with this email already exists");
	}

	const user = await User.create({
		name: body.name,
		email: body.email,
		passwordHash: await User.hashPassword(body.password),
		role: "DOCTOR",
		isActive: true,
	});

	try {
		const doctor = await Doctor.create({
			user: user._id,
			name: body.name,
			department: body.department,
			schedule: body.schedule,
			isActive: true,
		});
		await audit({
			userId: actor.id,
			role: actor.role,
			action: AUDIT_ACTIONS.DOCTOR_CREATED,
			entity: "Doctor",
			entityId: doctor.id,
		});
		return toDoctorDto(doctor);
	} catch (error) {
		// Compensating cleanup: delete created user if doctor profile creation fails
		await User.deleteOne({ _id: user._id }).catch(() => null);
		throw error;
	}
}

/**
 * Creates a new receptionist staff user account.
 */
export async function createReceptionist(
	body: CreateStaffBody,
	actor: AuthUser,
): Promise<AuthUser> {
	if (await User.exists({ email: body.email })) {
		throw new ConflictError("A user with this email already exists");
	}
	const user = await User.create({
		name: body.name,
		email: body.email,
		passwordHash: await User.hashPassword(body.password),
		role: "RECEPTIONIST",
		isActive: true,
	});
	await audit({
		userId: actor.id,
		role: actor.role,
		action: AUDIT_ACTIONS.STAFF_CREATED,
		entity: "User",
		entityId: user.id,
	});
	return { id: user.id, name: user.name, email: user.email, role: user.role };
}

/**
 * Lists all receptionist staff accounts ordered by creation date.
 */
export async function listReceptionists(): Promise<StaffDto[]> {
	const staff = await User.find({ role: "RECEPTIONIST" }).sort({
		createdAt: -1,
	});
	return staff.map((u) => ({
		id: u.id,
		name: u.name,
		email: u.email,
		role: u.role,
		isActive: u.isActive,
		createdAt: u.createdAt ? u.createdAt.toISOString() : undefined,
	}));
}

/**
 * Lists all active doctors ordered by name.
 */
export async function listDoctors(): Promise<DoctorDto[]> {
	const doctors = await Doctor.find({ isActive: true }).sort({ name: 1 });
	return doctors.map(toDoctorDto);
}

/**
 * Updates an existing doctor's profile (name, department, schedule, isActive)
 * and synchronizes the associated user account.
 */
export async function updateDoctor(
	doctorId: string,
	body: UpdateDoctorBody,
	actor: AuthUser,
): Promise<DoctorDto> {
	const doctor = await Doctor.findById(doctorId);
	if (!doctor) throw new NotFoundError("Doctor not found");

	if (body.name !== undefined) {
		doctor.name = body.name.trim();
		await User.updateOne({ _id: doctor.user }, { name: doctor.name });
	}

	if (body.department !== undefined) {
		doctor.department = body.department.trim();
	}

	if (body.schedule !== undefined) {
		doctor.schedule = body.schedule;
	}

	if (body.isActive !== undefined) {
		doctor.isActive = body.isActive;
	}

	await doctor.save();

	const isScheduleOnly =
		body.schedule !== undefined &&
		body.name === undefined &&
		body.department === undefined &&
		body.isActive === undefined;

	await audit({
		userId: actor.id,
		role: actor.role,
		action: isScheduleOnly
			? AUDIT_ACTIONS.SCHEDULE_UPDATED
			: AUDIT_ACTIONS.DOCTOR_UPDATED,
		entity: "Doctor",
		entityId: doctor.id,
		details: {
			name: body.name,
			department: body.department,
			schedule: body.schedule as unknown as Record<string, unknown>,
			isActive: body.isActive,
		},
	});

	return toDoctorDto(doctor);
}

/**
 * Updates a doctor's weekly consultation schedule.
 */
export const updateDoctorSchedule = updateDoctor;
