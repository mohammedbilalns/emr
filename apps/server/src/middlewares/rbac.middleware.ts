import type { Role } from "@emr/shared";
import type { NextFunction, Request, Response } from "express";
import { ForbiddenError, UnauthorizedError } from "../errors/base.error";

export function requireRoles(...roles: Role[]) {
	return (
		req: Request & { user: { role: Role } },
		_res: Response,
		next: NextFunction,
	): void => {
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
