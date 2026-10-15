import type { SlotsQuery } from "@emr/shared";
import type { Request, Response } from "express";
import { getSlots } from "../services/slot.service";
import { sendSuccess } from "../utils/api-response";

export async function getSlotsController(
	req: Request,
	res: Response,
): Promise<Response> {
	const query = req.validated?.query as SlotsQuery;
	return sendSuccess(res, {
		data: await getSlots(query.doctorId, query.date),
		message: "Slots retrieved",
	});
}
