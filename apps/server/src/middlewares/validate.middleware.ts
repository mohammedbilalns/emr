import type { NextFunction, Request, Response } from "express";
import { ZodError, type ZodType } from "zod";
import { ValidationError } from "../errors/base.error";

interface RequestSchemas {
	body?: ZodType;
	params?: ZodType;
	query?: ZodType;
}

export const validate =
	(schemas: RequestSchemas) =>
	(req: Request, _res: Response, next: NextFunction): void => {
		req.validated = {};
		try {
			if (schemas.body) req.validated.body = schemas.body.parse(req.body);
			if (schemas.params)
				req.validated.params = schemas.params.parse(req.params);
			if (schemas.query) req.validated.query = schemas.query.parse(req.query);
			next();
		} catch (error) {
			if (error instanceof ZodError) {
				next(
					new ValidationError(
						error.issues[0]?.message ?? "Validation failed",
						error.issues.map((i) => ({
							path: i.path.join("."),
							message: i.message,
						})),
					),
				);
				return;
			}
			next(error);
		}
	};
