import type { PaginationMeta } from "@emr/shared";
import type { Response } from "express";
import { HttpStatus } from "../config/constants";

// ---------------------------------------------------------------------------
// Response sending utilities for the API layer.
// Provides consistent success responses and pagination metadata.
// ---------------------------------------------------------------------------

interface SuccessOptions {
	message: string;
	status?: number;
	meta?: PaginationMeta; // Pagination metadata for list responses
}

// ---------------------------------------------------------------------------
// Sends a success JSON response.
// ---------------------------------------------------------------------------
export function sendSuccess<T>(
	res: Response,
	data: T,
	options: SuccessOptions,
): Response {
	return res.status(options.status ?? HttpStatus.OK).json({
		success: true,
		message: options.message,
		data,
		// Include pagination metadata only when provided
		...(options.meta && { meta: options.meta }),
	});
}

// ---------------------------------------------------------------------------
// Builds pagination metadata for API list endpoints.
// Calculates total pages based on total items and page size.
// ---------------------------------------------------------------------------
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
