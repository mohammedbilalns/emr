import { EventEmitter } from "node:events";

/**
 * Event emitter for appointment domain events (e.g. cache invalidation, real-time push).
 */
export const appointmentEvents = new EventEmitter();

export function emitAppointmentCreated(doctorId: string, date: string): void {
	appointmentEvents.emit("appointment:created", { doctorId, date });
}

export function emitAppointmentUpdated(
	id: string,
	doctorId: string,
	date: string,
): void {
	appointmentEvents.emit("appointment:updated", { id, doctorId, date });
}
