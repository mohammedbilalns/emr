import type { Role } from "@emr/shared";
import type { NextFunction, Request, Response } from "express";
import { UnauthorizedError } from "../errors/base.error";
import { User } from "../models/user.model";
import { verifyAccessToken } from "../utils/jwt";

export async function requireAuth(
	req: Request,
	_res: Response,
	next: NextFunction,
): Promise<void> {
	try {
		const header = req.headers.authorization;
		if (!header?.startsWith("Bearer ")) {
			throw new UnauthorizedError();
		}

		const payload = verifyAccessToken(header.slice(7)) as {
			sub: string;
			role: Role;
			email: string;
		};

		// DB check (not just JWT trust): catches users deactivated after token issuance.
		// One indexed findById per request — deliberate trade-off, documented.
		const user = await User.findById(payload.sub);
		if (!user || !user.isActive) {
			throw new UnauthorizedError();
		}

		req.user = {
			id: user.id,
			name: user.name,
			email: user.email,
			role: user.role,
		} as Request["user"];
		next();
	} catch (error) {
		next(error);
	}
}
