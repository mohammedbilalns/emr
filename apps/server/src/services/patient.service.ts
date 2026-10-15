import type { PatientDto } from "@emr/shared";
import { toPatientDto } from "../mappers/patient.mapper";
import { Patient } from "../models/patient.model";
import { escapeRegex } from "../utils/regex";

/**
 * Searches patients by query string across name, code, or mobile number.
 */
export async function searchPatients(
	q: string,
	limit: number,
): Promise<PatientDto[]> {
	const term = escapeRegex(q);
	const filter = /^\d{6,15}$/.test(q)
		? { mobile: new RegExp(`^${term}`) } // digits → mobile prefix (indexed)
		: /^p\d{0,10}$/i.test(q)
			? { patientCode: new RegExp(`^${term}`, "i") } // P… → patient code (unique indexed)
			: { name: new RegExp(`^${term}`, "i") }; // otherwise name prefix (indexed)

	const patients = await Patient.find(filter).sort({ name: 1 }).limit(limit);
	return patients.map(toPatientDto);
}
