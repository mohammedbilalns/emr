import type {
	AuthUser,
	CreateDoctorBody,
	CreateStaffBody,
	DoctorDto,
	UpdateDoctorScheduleBody,
} from "@emr/shared";
import { AUDIT_ACTIONS } from "../config/constants";
import { ConflictError, NotFoundError } from "../errors/base.error";
import { toDoctorDto } from "../mappers/doctor.mapper";
import { Doctor } from "../models/doctor.model";
import { User } from "../models/user.model";
import { audit } from "../utils/audit";

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
 * Lists all active doctors ordered by name.
 */
export async function listDoctors(): Promise<DoctorDto[]> {
	const doctors = await Doctor.find({ isActive: true }).sort({ name: 1 });
	return doctors.map(toDoctorDto);
}

/**
 * Updates a doctor's weekly consultation schedule.
 */
export async function updateDoctorSchedule(
	doctorId: string,
	body: UpdateDoctorScheduleBody,
	actor: AuthUser,
): Promise<DoctorDto> {
	const doctor = await Doctor.findById(doctorId);
	if (!doctor) throw new NotFoundError("Doctor not found");
	doctor.schedule = body.schedule;
	await doctor.save();
	await audit({
		userId: actor.id,
		role: actor.role,
		action: AUDIT_ACTIONS.SCHEDULE_UPDATED,
		entity: "Doctor",
		entityId: doctor.id,
		details: { schedule: body.schedule as unknown as Record<string, unknown> },
	});
	return toDoctorDto(doctor);
}
