export interface SessionDto {
	start: string;
	end: string;
}

export interface ScheduleDto {
	workingDays: number[];
	sessions: SessionDto[];
	breaks: SessionDto[];
	slotDuration: number;
}

export interface DoctorDto {
	id: string;
	name: string;
	department: string;
	schedule: ScheduleDto;
}

export type SlotStatus = "AVAILABLE" | "BOOKED";

export interface SlotDto {
	startTime: string;
	endTime: string;
	status: SlotStatus;
	appointmentId?: string;
}
