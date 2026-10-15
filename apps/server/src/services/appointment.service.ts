import {
	type AppointmentDto,
	type AppointmentListQuery,
	type AppointmentStatus,
	type AuthUser,
	type CreateAppointmentBody,
	STATUS_TRANSITIONS,
	type UpdateAppointmentBody,
} from "@emr/shared";
import mongoose from "mongoose";
import { AUDIT_ACTIONS, type AuditAction } from "../config/constants";
import {
	ConflictError,
	InvalidStatusTransitionError,
	NotFoundError,
	SlotConflictError,
	ValidationError,
} from "../errors/base.error";
import {
	emitAppointmentCreated,
	emitAppointmentUpdated,
} from "../events/appointment-events";
import { toAppointmentDto } from "../mappers/appointment.mapper";
import { Appointment } from "../models/appointment.model";
import { Counter } from "../models/counter.model";
import { Doctor } from "../models/doctor.model";
import { Patient } from "../models/patient.model";
import { audit } from "../utils/audit";
import { escapeRegex } from "../utils/regex";
import { generateSlots } from "./slot.service";

interface ListResult {
	items: AppointmentDto[];
	total: number;
	page: number;
	limit: number;
}

async function nextPatientCode(): Promise<string> {
	// Deliberately OUTSIDE any transaction: $inc-on-upsert inside a transaction causes
	// write conflicts under concurrency. A burned sequence number on abort is harmless (documented).
	const counter = await Counter.findOneAndUpdate(
		{ _id: "patient" },
		{ $inc: { seq: 1 } },
		{ upsert: true, returnDocument: "after" },
	);
	return `P${String(counter.seq).padStart(6, "0")}`;
}

function isDuplicateKey(error: unknown, field?: string): boolean {
	return (
		error instanceof mongoose.mongo.MongoServerError &&
		error.code === 11000 &&
		(field === undefined || field in (error.keyValue ?? {}))
	);
}

function isWriteConflict(error: unknown): boolean {
	if (error instanceof mongoose.mongo.MongoServerError) {
		if (error.code === 112 || error.codeName === "WriteConflict") return true;
		if (
			typeof error.hasErrorLabel === "function" &&
			error.hasErrorLabel("TransientTransactionError")
		) {
			return true;
		}
	}
	return false;
}

export async function bookAppointment(
	body: CreateAppointmentBody,
	actor: AuthUser,
): Promise<AppointmentDto> {
	const doctor = await Doctor.findOne({ _id: body.doctorId, isActive: true });
	if (!doctor) throw new NotFoundError("Doctor not found");

	// GATE 1 — the requested time must be a REAL generated slot. This single check rejects
	// forged times, break periods, non-working days, past dates, and misaligned durations.
	const slot = generateSlots(doctor.schedule, body.date).find(
		(s) => s.startTime === body.startTime,
	);
	if (!slot) {
		throw new ValidationError(
			"The requested time is not an available slot for this doctor on this date",
		);
	}

	// GATE 2 — atomicity for the new-patient + booking pair (replica set required).
	const session = await mongoose.startSession();
	let inTx = false;
	try {
		try {
			session.startTransaction();
			inTx = true;
		} catch {
			// Standalone mongod fallback
		}

		let patientId: mongoose.Types.ObjectId;
		let patientCode: string;
		let patientName: string;
		let patientMobile: string;

		if (body.patient.type === "EXISTING") {
			const existingPatient = await Patient.findById(
				body.patient.patientId,
			).session(session);
			if (!existingPatient) throw new NotFoundError("Patient not found");
			patientId = existingPatient._id;
			patientCode = existingPatient.patientCode;
			patientName = existingPatient.name;
			patientMobile = existingPatient.mobile;
		} else {
			const code = await nextPatientCode();
			const newPatient = new Patient({
				patientCode: code,
				name: body.patient.name,
				mobile: body.patient.mobile,
				gender: body.patient.gender,
				...(body.patient.dateOfBirth && {
					dateOfBirth: body.patient.dateOfBirth,
				}),
			});
			await newPatient.save({ session });
			patientId = newPatient._id;
			patientCode = newPatient.patientCode;
			patientName = newPatient.name;
			patientMobile = newPatient.mobile;
		}

		// GATE 3 — the partial unique index { doctor, date, startTime } on active docs.
		// Two concurrent inserts for the same slot: Mongo allows exactly one, the other gets E11000.
		const [appointment] = await Appointment.create(
			[
				{
					doctor: doctor._id,
					doctorName: doctor.name,
					patient: patientId,
					patientCode,
					patientName,
					patientMobile,
					department: doctor.department,
					date: body.date,
					startTime: slot.startTime,
					endTime: slot.endTime,
					status: "SCHEDULED",
					purpose: body.purpose,
					active: true,
					createdBy: actor.id,
				},
			],
			{ session },
		);

		if (inTx) await session.commitTransaction();

		await audit({
			userId: actor.id,
			role: actor.role,
			action: AUDIT_ACTIONS.APPOINTMENT_CREATED,
			entity: "Appointment",
			entityId: appointment.id,
		});
		emitAppointmentCreated(doctor.id, body.date);
		return toAppointmentDto(appointment);
	} catch (error) {
		if (inTx) await session.abortTransaction();
		if (isDuplicateKey(error, "startTime")) {
			throw new SlotConflictError({
				date: body.date,
				startTime: body.startTime,
			});
		}
		if (isDuplicateKey(error, "mobile")) {
			throw new ConflictError(
				"A patient with this mobile number already exists",
			);
		}
		if (isWriteConflict(error)) {
			const slotTaken = await Appointment.exists({
				doctor: doctor._id,
				date: body.date,
				startTime: body.startTime,
				active: true,
			});
			if (slotTaken) {
				throw new SlotConflictError({
					date: body.date,
					startTime: body.startTime,
				});
			}
			throw new ConflictError("Appointment conflict — please retry");
		}
		throw error;
	} finally {
		session.endSession();
	}
}

export async function listAppointments(
	query: AppointmentListQuery,
	actor: AuthUser,
): Promise<ListResult> {
	const filter: Record<string, unknown> = {};

	if (actor.role === "DOCTOR") {
		// Doctors see ONLY their own appointments — resolved from the authenticated actor,
		// never from client-supplied query params (no IDOR).
		const doctor = await Doctor.findOne({ user: actor.id });
		if (!doctor) {
			return { items: [], total: 0, page: query.page, limit: query.limit };
		}
		filter.doctor = doctor._id;
	} else {
		if (query.doctorId) filter.doctor = query.doctorId;
		if (query.patientId) filter.patient = query.patientId;
	}

	if (query.department) filter.department = query.department;
	if (query.status) filter.status = query.status;
	if (query.mobile) {
		filter.patientMobile = new RegExp(`^${escapeRegex(query.mobile)}`);
	}
	if (query.dateFrom || query.dateTo) {
		// Lexicographic comparison is correct for YYYY-MM-DD strings — another string-date win.
		filter.date = {
			...(query.dateFrom && { $gte: query.dateFrom }),
			...(query.dateTo && { $lte: query.dateTo }),
		};
	}

	const dir = query.sortOrder === "asc" ? 1 : -1;
	const sort: Record<string, 1 | -1> = { [query.sortBy]: dir, _id: dir }; // _id tiebreaker = stable pages

	const [docs, total] = await Promise.all([
		Appointment.find(filter)
			.sort(sort)
			.skip((query.page - 1) * query.limit)
			.limit(query.limit),
		Appointment.countDocuments(filter), // count + page data share ONE filter object — no duplicated logic
	]);

	return {
		items: docs.map(toAppointmentDto),
		total,
		page: query.page,
		limit: query.limit,
	};
}

export async function getAppointment(
	id: string,
	actor: AuthUser,
): Promise<AppointmentDto> {
	const appointment = await Appointment.findById(id);
	if (!appointment) throw new NotFoundError("Appointment not found");
	if (actor.role === "DOCTOR") {
		const doctor = await Doctor.findOne({ user: actor.id });
		if (!doctor || String(appointment.doctor) !== doctor.id) {
			throw new NotFoundError("Appointment not found");
		}
	}
	return toAppointmentDto(appointment);
}

export async function updateAppointment(
	id: string,
	body: UpdateAppointmentBody,
	actor: AuthUser,
): Promise<AppointmentDto> {
	const existing = await Appointment.findOne({ _id: id, active: true });
	if (!existing) throw new NotFoundError("Appointment not found");

	if (actor.role === "DOCTOR") {
		const doctor = await Doctor.findOne({ user: actor.id });
		if (!doctor || String(existing.doctor) !== doctor.id) {
			throw new NotFoundError("Appointment not found");
		}
	}

	const updatePayload: Record<string, unknown> = { updatedBy: actor.id };
	// When actor is a DOCTOR, strip purpose and allow only consultation notes
	if (actor.role !== "DOCTOR" && body.purpose !== undefined) {
		updatePayload.purpose = body.purpose;
	}
	if (body.notes !== undefined) {
		updatePayload.notes = body.notes;
	}

	const updated = await Appointment.findByIdAndUpdate(
		id,
		{ $set: updatePayload },
		{ returnDocument: "after" },
	);
	if (!updated) throw new NotFoundError("Appointment not found");
	await audit({
		userId: actor.id,
		role: actor.role,
		action: AUDIT_ACTIONS.APPOINTMENT_UPDATED,
		entity: "Appointment",
		entityId: id,
	});
	emitAppointmentUpdated(id, String(updated.doctor), updated.date);
	return toAppointmentDto(updated);
}

/** Shared engine for arrive / cancel / complete — one status machine, three verbs. */
async function transitionStatus(
	id: string,
	to: AppointmentStatus,
	actor: AuthUser,
	auditAction: AuditAction,
): Promise<AppointmentDto> {
	const appointment = await Appointment.findById(id);
	if (!appointment) throw new NotFoundError("Appointment not found");

	if (actor.role === "DOCTOR") {
		const doctor = await Doctor.findOne({ user: actor.id });
		if (!doctor || String(appointment.doctor) !== doctor.id) {
			throw new NotFoundError("Appointment not found");
		}
	}

	if (!STATUS_TRANSITIONS[appointment.status].includes(to)) {
		throw new InvalidStatusTransitionError(appointment.status, to);
	}

	// Optimistic guard: the update only applies if the state we validated against still holds —
	// two concurrent "arrive" clicks can't both succeed.
	const updated = await Appointment.findOneAndUpdate(
		{ _id: id, status: appointment.status },
		{
			$set: {
				status: to,
				updatedBy: actor.id,
				...(to === "CANCELLED" && { active: false }),
			},
		},
		{ returnDocument: "after" },
	);
	if (!updated) {
		throw new ConflictError(
			"Appointment was changed by another user — please retry",
		);
	}

	// active:false drops the doc from the partial unique index → the slot becomes rebookable.
	await audit({
		userId: actor.id,
		role: actor.role,
		action: auditAction,
		entity: "Appointment",
		entityId: id,
	});
	emitAppointmentUpdated(id, String(updated.doctor), updated.date);
	return toAppointmentDto(updated);
}

export const markArrived = (id: string, actor: AuthUser) =>
	transitionStatus(id, "ARRIVED", actor, AUDIT_ACTIONS.PATIENT_ARRIVED);

export const cancelAppointment = (id: string, actor: AuthUser) =>
	transitionStatus(id, "CANCELLED", actor, AUDIT_ACTIONS.APPOINTMENT_CANCELLED);

export const completeAppointment = (id: string, actor: AuthUser) =>
	transitionStatus(id, "COMPLETED", actor, AUDIT_ACTIONS.APPOINTMENT_UPDATED);
