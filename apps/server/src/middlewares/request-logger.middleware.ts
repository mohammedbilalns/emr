import type { NextFunction, Request, Response } from "express";
import logger from "../logging/logger";

/**
 * Logs HTTP request method, path, status, and duration in milliseconds using high-resolution timestamps.
 */
export function requestLogger(
	req: Request,
	res: Response,
	next: NextFunction,
): void {
	const start = process.hrtime.bigint();
	res.on("finish", () => {
		const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
		logger.info(
			{
				method: req.method,
				url: req.originalUrl,
				status: res.statusCode,
				durationMs: Math.round(durationMs),
			},
			"http request",
		);
	});
	next();
}
