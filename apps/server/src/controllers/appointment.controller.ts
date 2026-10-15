import type {
	AppointmentListQuery,
	AuthUser,
	CreateAppointmentBody,
	UpdateAppointmentBody,
} from "@emr/shared";
import type { Request, Response } from "express";
import { HttpStatus } from "../config/constants";
import * as appointmentService from "../services/appointment.service";
import { buildPaginationMeta, sendSuccess } from "../utils/api-response";

export async function createAppointmentHandler(
	req: Request,
	res: Response,
): Promise<Response> {
	const user = req.user as AuthUser;
	const body = req.validated?.body as CreateAppointmentBody;
	const appointment = await appointmentService.bookAppointment(body, user);
	return sendSuccess(res, {
		data: appointment,
		message: "Appointment booked successfully",
		status: HttpStatus.CREATED,
	});
}

export async function listAppointmentsHandler(
	req: Request,
	res: Response,
): Promise<Response> {
	const user = req.user as AuthUser;
	const query = req.validated?.query as AppointmentListQuery;
	const result = await appointmentService.listAppointments(query, user);
	return sendSuccess(res, {
		data: result.items,
		message: "Appointments retrieved",
		meta: buildPaginationMeta(result.page, result.limit, result.total),
	});
}

export async function getAppointmentHandler(
	req: Request,
	res: Response,
): Promise<Response> {
	const user = req.user as AuthUser;
	const params = req.validated?.params as { id: string };
	const appointment = await appointmentService.getAppointment(params.id, user);
	return sendSuccess(res, {
		data: appointment,
		message: "Appointment retrieved",
	});
}

export async function updateAppointmentHandler(
	req: Request,
	res: Response,
): Promise<Response> {
	const user = req.user as AuthUser;
	const params = req.validated?.params as { id: string };
	const body = req.validated?.body as UpdateAppointmentBody;
	const appointment = await appointmentService.updateAppointment(
		params.id,
		body,
		user,
	);
	return sendSuccess(res, {
		data: appointment,
		message: "Appointment updated successfully",
	});
}

export async function cancelAppointmentHandler(
	req: Request,
	res: Response,
): Promise<Response> {
	const user = req.user as AuthUser;
	const params = req.validated?.params as { id: string };
	const appointment = await appointmentService.cancelAppointment(
		params.id,
		user,
	);
	return sendSuccess(res, {
		data: appointment,
		message: "Appointment cancelled successfully",
	});
}

export async function markArrivedHandler(
	req: Request,
	res: Response,
): Promise<Response> {
	const user = req.user as AuthUser;
	const params = req.validated?.params as { id: string };
	const appointment = await appointmentService.markArrived(params.id, user);
	return sendSuccess(res, {
		data: appointment,
		message: "Patient marked as arrived",
	});
}

export async function completeAppointmentHandler(
	req: Request,
	res: Response,
): Promise<Response> {
	const user = req.user as AuthUser;
	const params = req.validated?.params as { id: string };
	const appointment = await appointmentService.completeAppointment(
		params.id,
		user,
	);
	return sendSuccess(res, {
		data: appointment,
		message: "Appointment marked as completed",
	});
}
