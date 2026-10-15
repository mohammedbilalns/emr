export interface PatientDto {
	id: string;
	patientCode: string;
	name: string;
	mobile: string;
	gender: "MALE" | "FEMALE" | "OTHER";
	dateOfBirth?: string;
}
