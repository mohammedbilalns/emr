import type {
	AuthUser,
	CreateDoctorBody,
	CreateStaffBody,
	UpdateDoctorBody,
} from "@emr/shared";
import type { Request, Response } from "express";
import { HttpStatus } from "../../config/constants";
import { sendSuccess } from "../../utils/api-response";
import * as doctorService from "./doctor.service";

export async function createDoctor(
	req: Request,
	res: Response,
): Promise<Response> {
	const user = req.user as AuthUser;
	const body = req.validated?.body as CreateDoctorBody;
	const doctor = await doctorService.createDoctor(body, user);
	return sendSuccess(res, {
		data: doctor,
		message: "Doctor created successfully",
		status: HttpStatus.CREATED,
	});
}

export async function createReceptionist(
	req: Request,
	res: Response,
): Promise<Response> {
	const user = req.user as AuthUser;
	const body = req.validated?.body as CreateStaffBody;
	const result = await doctorService.createReceptionist(body, user);
	return sendSuccess(res, {
		data: result,
		message: "Receptionist created successfully",
		status: HttpStatus.CREATED,
	});
}

export async function listReceptionists(
	_req: Request,
	res: Response,
): Promise<Response> {
	return sendSuccess(res, {
		data: await doctorService.listReceptionists(),
		message: "Staff members retrieved",
	});
}

export async function listDoctors(
	_req: Request,
	res: Response,
): Promise<Response> {
	return sendSuccess(res, {
		data: await doctorService.listDoctors(),
		message: "Doctors retrieved",
	});
}

export async function updateDoctor(
	req: Request,
	res: Response,
): Promise<Response> {
	const user = req.user as AuthUser;
	const params = req.validated?.params as { id: string };
	const body = req.validated?.body as UpdateDoctorBody;
	const doctor = await doctorService.updateDoctor(params.id, body, user);
	return sendSuccess(res, {
		data: doctor,
		message: "Doctor updated successfully",
	});
}

export const updateSchedule = updateDoctor;
