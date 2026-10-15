import type { PatientSearchQuery } from "@emr/shared";
import type { Request, Response } from "express";
import * as patientService from "../services/patient.service";
import { sendSuccess } from "../utils/api-response";

export async function searchPatientsHandler(
	req: Request,
	res: Response,
): Promise<Response> {
	const query = req.validated?.query as PatientSearchQuery;
	const patients = await patientService.searchPatients(query.q, query.limit);
	return sendSuccess(res, patients, { message: "Patients retrieved" });
}
