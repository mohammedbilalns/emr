import type { DoctorDto } from "@emr/shared";
import type { DoctorDocument } from "./doctor.model";

export function toDoctorDto(doc: DoctorDocument): DoctorDto {
	return {
		id: doc.id,
		name: doc.name,
		department: doc.department,
		schedule: {
			workingDays: [...doc.schedule.workingDays],
			sessions: doc.schedule.sessions.map((s) => ({
				start: s.start,
				end: s.end,
			})),
			breaks: doc.schedule.breaks.map((b) => ({ start: b.start, end: b.end })),
			slotDuration: doc.schedule.slotDuration,
		},
	};
}
