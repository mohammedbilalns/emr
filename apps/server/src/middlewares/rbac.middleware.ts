import type { Role } from "@emr/shared";
import type { NextFunction, Request, Response } from "express";
import { ForbiddenError, UnauthorizedError } from "../errors/base.error";

/**
 * Restricts endpoint access to authenticated users possessing at least one of the specified roles.
 */
export function requireRoles(...roles: Role[]) {
	return (req: Request, _res: Response, next: NextFunction): void => {
		if (!req.user) {
			next(new UnauthorizedError());
			return;
		}
		if (!roles.includes(req.user.role)) {
			next(new ForbiddenError());
			return;
		}
		next();
	};
}
