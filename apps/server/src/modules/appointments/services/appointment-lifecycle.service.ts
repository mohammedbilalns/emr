import {
	type AppointmentDto,
	type AppointmentStatus,
	type AuthUser,
	STATUS_TRANSITIONS,
	type UpdateAppointmentBody,
} from "@emr/shared";
import { AUDIT_ACTIONS, type AuditAction } from "../../../config/constants";
import {
	ConflictError,
	InvalidStatusTransitionError,
	NotFoundError,
} from "../../../errors/base.error";
import { audit } from "../../audit";
import { Doctor } from "../../doctors";
import { toAppointmentDto } from "../appointment.mapper";
import { Appointment } from "../appointment.model";
import { emitAppointmentUpdated } from "../appointment-events";

/**
 * Updates appointment purpose or consultation notes.
 */
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

/**
 * Enforces valid lifecycle status transitions with optimistic concurrency protection.
 */
export async function transitionStatus(
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

	// Optimistic guard: update only applies if the validated status still holds,
	// preventing concurrent duplicate transitions.
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
