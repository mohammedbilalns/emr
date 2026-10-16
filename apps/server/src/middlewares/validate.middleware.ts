import { formatFriendlyErrorMessage } from "@emr/shared";
import type { NextFunction, Request, Response } from "express";
import { ZodError, type ZodType } from "zod";
import { ValidationError } from "../errors/base.error";

export interface RequestSchemas {
	body?: ZodType;
	params?: ZodType;
	query?: ZodType;
}

/**
 * Validates `req.body`, `req.params`, and `req.query` against Zod schemas,
 * storing parsed data in `req.validated` and forwarding structured validation errors.
 */
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
				const primaryMsg = error.issues[0]?.message ?? "Validation failed";
				const field = error.issues[0]?.path.slice(-1)[0]?.toString();
				next(
					new ValidationError(
						formatFriendlyErrorMessage(primaryMsg, field),
						error.issues.map((i) => ({
							path: i.path.join("."),
							message: formatFriendlyErrorMessage(
								i.message,
								i.path[i.path.length - 1]?.toString(),
							),
						})),
					),
				);
				return;
			}
			next(error);
		}
	};
