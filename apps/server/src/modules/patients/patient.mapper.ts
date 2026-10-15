import type { PatientDto } from "@emr/shared";
import type { PatientDocument } from "./patient.model";

export function toPatientDto(doc: PatientDocument): PatientDto {
	return {
		id: doc.id,
		patientCode: doc.patientCode,
		name: doc.name,
		mobile: doc.mobile,
		gender: doc.gender,
		...(doc.dateOfBirth && { dateOfBirth: doc.dateOfBirth }),
	};
}
