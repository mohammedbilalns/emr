import type { AppointmentStatus } from "../constants/appointment-status";

export interface AppointmentDto {
	id: string;
	doctor: { id: string; name: string; department: string };
	patient: { id: string; patientCode: string; name: string; mobile: string };
	date: string;
	startTime: string;
	endTime: string;
	status: AppointmentStatus;
	purpose?: string;
	notes?: string;
	createdAt: string;
	updatedAt: string;
}
