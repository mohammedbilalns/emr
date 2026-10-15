import { EventEmitter } from "node:events";
import type {
	AppointmentCancelledEvent,
	AppointmentCreatedEvent,
	AppointmentUpdatedEvent,
} from "@emr/shared";

/**
 * Event emitter for appointment domain events (e.g. cache invalidation, real-time WebSocket push).
 */
export const appointmentEvents = new EventEmitter();

export function emitAppointmentCreated(event: AppointmentCreatedEvent): void {
	appointmentEvents.emit("appointment:created", event);
}

export function emitAppointmentUpdated(event: AppointmentUpdatedEvent): void {
	appointmentEvents.emit("appointment:updated", event);
}

export function emitAppointmentCancelled(
	event: AppointmentCancelledEvent,
): void {
	appointmentEvents.emit("appointment:cancelled", event);
}
