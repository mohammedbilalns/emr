import type { AppointmentDto } from "@emr/shared";
import type { AppointmentDocument } from "./appointment.model";

export function toAppointmentDto(doc: AppointmentDocument): AppointmentDto {
	const createdAt =
		"createdAt" in doc && doc.createdAt instanceof Date
			? doc.createdAt.toISOString()
			: new Date().toISOString();
	const updatedAt =
		"updatedAt" in doc && doc.updatedAt instanceof Date
			? doc.updatedAt.toISOString()
			: new Date().toISOString();

	return {
		id: doc.id,
		doctor: {
			id: String(doc.doctor),
			name: doc.doctorName,
			department: doc.department,
		},
		patient: {
			id: String(doc.patient),
			patientCode: doc.patientCode,
			name: doc.patientName,
			mobile: doc.patientMobile,
		},
		date: doc.date,
		startTime: doc.startTime,
		endTime: doc.endTime,
		status: doc.status,
		...(doc.purpose && { purpose: doc.purpose }),
		...(doc.notes && { notes: doc.notes }),
		createdAt,
		updatedAt,
	};
}
