import type {
	AppointmentDto,
	AuthUser,
	CreateAppointmentBody,
} from "@emr/shared";
import mongoose from "mongoose";
import { AUDIT_ACTIONS } from "../../../config/constants";
import {
	ConflictError,
	NotFoundError,
	SlotConflictError,
	ValidationError,
} from "../../../errors/base.error";
import { isDuplicateKey, isWriteConflict } from "../../../utils/mongo-errors";
import { audit } from "../../audit";
import { Doctor } from "../../doctors";
import { Counter, Patient } from "../../patients";
import { generateSlots } from "../../slots";
import { toAppointmentDto } from "../appointment.mapper";
import { Appointment } from "../appointment.model";
import { emitAppointmentCreated } from "../appointment-events";

async function nextPatientCode(): Promise<string> {
	// Increment counter outside the transaction to avoid write conflicts under concurrency.
	// Sequence gaps resulting from aborted bookings are acceptable.
	const counter = await Counter.findOneAndUpdate(
		{ _id: "patient" },
		{ $inc: { seq: 1 } },
		{ upsert: true, returnDocument: "after" },
	);
	return `P${String(counter.seq).padStart(6, "0")}`;
}

function hasTopology(
	val: unknown,
): val is { topology: { description: { type: string } } } {
	if (!val || typeof val !== "object") return false;
	if (
		!("topology" in val) ||
		!val.topology ||
		typeof val.topology !== "object"
	) {
		return false;
	}
	const top = val.topology;
	if (
		!("description" in top) ||
		!top.description ||
		typeof top.description !== "object"
	) {
		return false;
	}
	const desc = top.description;
	return "type" in desc && typeof desc.type === "string";
}

function supportsTransactions(): boolean {
	const client: unknown = mongoose.connection.getClient();
	if (hasTopology(client)) {
		const type = client.topology.description.type;
		return type === "ReplicaSetWithPrimary" || type === "Sharded";
	}
	return false;
}

/**
 * Books an appointment with slot validation, patient creation, and double-booking guards.
 */
export async function bookAppointment(
	body: CreateAppointmentBody,
	actor: AuthUser,
): Promise<AppointmentDto> {
	const doctor = await Doctor.findOne({ _id: body.doctorId, isActive: true });
	if (!doctor) throw new NotFoundError("Doctor not found");

	// Verify that the requested start time matches an available slot in the doctor's schedule
	const slot = generateSlots(doctor.schedule, body.date).find(
		(s) => s.startTime === body.startTime,
	);
	if (!slot) {
		throw new ValidationError(
			"The requested time is not an available slot for this doctor on this date",
		);
	}

	// Attempt a transaction for atomic patient creation and appointment booking if supported by deployment
	const canUseTx = supportsTransactions();
	const session = canUseTx ? await mongoose.startSession() : null;
	let inTx = false;
	if (session) {
		try {
			session.startTransaction();
			inTx = true;
		} catch {
			// Standalone MongoDB instances do not support transactions; proceed non-transactionally
		}
	}

	let patientId: mongoose.Types.ObjectId | undefined;
	let patientCode: string;
	let patientName: string;
	let patientMobile: string;

	try {
		if (body.patient.type === "EXISTING") {
			const query = Patient.findById(body.patient.patientId);
			if (session) query.session(session);
			const existingPatient = await query;
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
			if (session) {
				await newPatient.save({ session });
			} else {
				await newPatient.save();
			}
			patientId = newPatient._id;
			patientCode = newPatient.patientCode;
			patientName = newPatient.name;
			patientMobile = newPatient.mobile;
		}

		// The partial unique index on { doctor, date, startTime } prevents concurrent double-bookings
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
			session ? { session } : undefined,
		);

		if (inTx && session) await session.commitTransaction();

		await audit({
			userId: actor.id,
			role: actor.role,
			action: AUDIT_ACTIONS.APPOINTMENT_CREATED,
			entity: "Appointment",
			entityId: appointment.id,
		});
		const dto = toAppointmentDto(appointment);
		emitAppointmentCreated({
			appointment: dto,
			doctorId: doctor.id,
			date: body.date,
			startTime: slot.startTime,
			endTime: slot.endTime,
		});
		return dto;
	} catch (error) {
		if (inTx && session) {
			await session.abortTransaction().catch(() => null);
		} else if (body.patient.type === "NEW" && patientId) {
			// Compensating cleanup for newly created patient if appointment booking fails without transactions
			await Patient.deleteOne({ _id: patientId }).catch(() => null);
		}
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
		if (session) {
			await session.endSession();
		}
	}
}
