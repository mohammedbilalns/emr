import type { Request, Response } from "express";
import { HttpStatus } from "../config/constants";
import { getDatabaseHealth } from "../config/db";
import { sendSuccess } from "../utils/api-response";

/**
 * Verifies server uptime and MongoDB database connectivity.
 * Returns HTTP 200 with uptime and database metadata if healthy,
 * or HTTP 500 with degraded status details if unreachable.
 */
export async function healthHandler(
	_req: Request,
	res: Response,
): Promise<Response> {
	const dbHealth = await getDatabaseHealth();
	const isHealthy = dbHealth.healthy;

	const payload = {
		status: isHealthy ? "healthy" : "unhealthy",
		uptime: process.uptime(),
		timestamp: new Date().toISOString(),
		database: dbHealth,
	};

	if (isHealthy) {
		return sendSuccess(res, {
			data: payload,
			message: "Service is healthy",
		});
	}

	return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
		success: false,
		message: "Service degraded: database disconnected",
		data: payload,
	});
}
