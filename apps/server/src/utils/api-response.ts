import type { PaginationMeta } from "@emr/shared";
import type { Response } from "express";
import { HttpStatus } from "../config/constants";

export interface SuccessOptions {
	message: string;
	status?: number;
	meta?: PaginationMeta;
}

/**
 * Sends a standardized JSON success response, omitting the data key when undefined or null.
 */
export function sendSuccess<T = unknown>(
	res: Response,
	options: SuccessOptions & { data?: T | null },
): Response {
	const { message, status = HttpStatus.OK, data, meta } = options;

	return res.status(status).json({
		success: true,
		message,
		...(data != null && { data }),
		...(meta && { meta }),
	});
}

/**
 * Builds pagination metadata, ensuring totalPages is at least 1 even on empty sets.
 */
export function buildPaginationMeta(
	page: number,
	limit: number,
	total: number,
): PaginationMeta {
	return {
		page,
		limit,
		total,
		totalPages: Math.max(1, Math.ceil(total / limit)),
	};
}
