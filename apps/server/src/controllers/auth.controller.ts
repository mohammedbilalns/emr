import type { AuthUser, LoginBody } from "@emr/shared";
import type { Request, Response } from "express";
import { COOKIE_NAMES, ErrorMessages } from "../config/constants";
import { UnauthorizedError } from "../errors/base.error";
import * as authService from "../services/auth.service";
import { sendSuccess } from "../utils/api-response";
import { clearRefreshCookie, setRefreshCookie } from "../utils/cookies";

export async function login(req: Request, res: Response): Promise<Response> {
	const result = await authService.login(req.validated?.body as LoginBody);
	setRefreshCookie(res, result.refreshToken);
	return sendSuccess(res, {
		data: { user: result.user, accessToken: result.accessToken },
		message: "Logged in successfully",
	});
}

export async function refresh(req: Request, res: Response): Promise<Response> {
	const token = req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN];
	if (!token) throw new UnauthorizedError(ErrorMessages.INVALID_REFRESH_TOKEN);

	const result = await authService.refresh(token);
	setRefreshCookie(res, result.refreshToken);
	return sendSuccess(res, {
		data: { user: result.user, accessToken: result.accessToken },
		message: "Token refreshed",
	});
}

export async function logout(req: Request, res: Response): Promise<Response> {
	const user = req.user as AuthUser;
	if (!user) return sendSuccess(res, { message: "No user session" });
	await authService.logout(req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN], user);
	clearRefreshCookie(res);
	return sendSuccess(res, { message: "Logged out successfully" });
}

export function me(req: Request, res: Response): Response {
	return sendSuccess(res, {
		data: req.user as AuthUser,
		message: "Session valid",
	});
}
