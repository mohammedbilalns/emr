import type { PatientSearchQuery } from "@emr/shared";
import type { Request, Response } from "express";
import { sendSuccess } from "../../utils/api-response";
import * as patientService from "./patient.service";

export async function searchPatientsHandler(
	req: Request,
	res: Response,
): Promise<Response> {
	const query = req.validated?.query as PatientSearchQuery;
	const patients = await patientService.searchPatients(query.q, query.limit);
	return sendSuccess(res, {
		data: patients,
		message: "Patients retrieved",
	});
}
