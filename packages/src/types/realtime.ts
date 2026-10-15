import type { AppointmentStatus } from "../constants/appointment-status";
import type { AppointmentDto } from "./appointment";

export interface AppointmentCreatedEvent {
	appointment: AppointmentDto;
	doctorId: string;
	date: string;
	startTime: string;
	endTime: string;
}

export interface AppointmentUpdatedEvent {
	appointment: AppointmentDto;
	doctorId: string;
	date: string;
	startTime: string;
	endTime: string;
	status: AppointmentStatus;
}

export interface AppointmentCancelledEvent {
	appointment: AppointmentDto;
	doctorId: string;
	date: string;
	startTime: string;
	endTime: string;
}

export interface SlotBookedEvent {
	doctorId: string;
	date: string;
	startTime: string;
	endTime: string;
	appointmentId?: string;
}

export interface SlotReleasedEvent {
	doctorId: string;
	date: string;
	startTime: string;
	endTime: string;
}

export interface SchedulerRoomPayload {
	doctorId: string;
	date: string;
}

export interface ServerToClientEvents {
	"appointment:created": (data: AppointmentCreatedEvent) => void;
	"appointment:updated": (data: AppointmentUpdatedEvent) => void;
	"appointment:cancelled": (data: AppointmentCancelledEvent) => void;
	"slot:booked": (data: SlotBookedEvent) => void;
	"slot:released": (data: SlotReleasedEvent) => void;
}

export interface ClientToServerEvents {
	"scheduler:join": (data: SchedulerRoomPayload) => void;
	"scheduler:leave": (data: SchedulerRoomPayload) => void;
}
