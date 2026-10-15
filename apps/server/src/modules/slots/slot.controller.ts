import type { SlotsQuery } from "@emr/shared";
import type { Request, Response } from "express";
import { sendSuccess } from "../../utils/api-response";
import { getSlots } from "./slot.service";

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
