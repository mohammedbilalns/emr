import type { Request, Response } from "express";
import { HttpStatus } from "../config/constants";

export function notFoundHandler(req: Request, res: Response): void {
	res.status(HttpStatus.NOT_FOUND).json({
		success: false,
		message: `Route ${req.method} ${req.originalUrl} not found`,
	});
}
