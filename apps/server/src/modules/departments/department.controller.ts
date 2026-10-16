import type { Request, Response } from "express";
import { sendSuccess } from "../../utils/api-response";
import * as departmentService from "./department.service";

/**
 * Handles listing of clinical departments.
 */
export async function listDepartments(
	_req: Request,
	res: Response,
): Promise<Response> {
	const departments = await departmentService.listDepartments();
	return sendSuccess(res, {
		data: departments.map((d) => ({
			id: d.id,
			name: d.name,
			isActive: d.isActive,
		})),
		message: "Departments retrieved successfully",
	});
}
