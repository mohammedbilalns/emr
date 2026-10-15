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

	// Attempt a transaction for atomic patient creation and appointment booking
	const session = await mongoose.startSession();
	let inTx = false;
	try {
		try {
			session.startTransaction();
			inTx = true;
		} catch {
			// Standalone MongoDB instances do not support transactions; proceed non-transactionally
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
