import type {
	AuthUser,
	CreateDoctorBody,
	CreateStaffBody,
	UpdateDoctorScheduleBody,
} from "@emr/shared";
import type { Request, Response } from "express";
import { HttpStatus } from "../config/constants";
import * as doctorService from "../services/doctor.service";
import { sendSuccess } from "../utils/api-response";

export async function createDoctor(
	req: Request,
	res: Response,
): Promise<Response> {
	const user = req.user as AuthUser;
	const body = req.validated?.body as CreateDoctorBody;
	const doctor = await doctorService.createDoctor(body, user);
	return sendSuccess(res, doctor, {
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
	return sendSuccess(res, result, {
		message: "Receptionist created successfully",
		status: HttpStatus.CREATED,
	});
}

export async function listDoctors(
	_req: Request,
	res: Response,
): Promise<Response> {
	return sendSuccess(res, await doctorService.listDoctors(), {
		message: "Doctors retrieved",
	});
}

export async function updateSchedule(
	req: Request,
	res: Response,
): Promise<Response> {
	const user = req.user as AuthUser;
	const params = req.validated?.params as { id: string };
	const body = req.validated?.body as UpdateDoctorScheduleBody;
	const doctor = await doctorService.updateDoctorSchedule(
		params.id,
		body,
		user,
	);
	return sendSuccess(res, doctor, { message: "Schedule updated successfully" });
}
