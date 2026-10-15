import type { Response } from "express";
import { COOKIE_NAMES } from "../config/constants";
import { env } from "../config/env";
import { REFRESH_TTL_MS } from "./jwt";

/**
 * Base cookie options enforcing httpOnly, strict path scoping to auth endpoints,
 * and environment-aware secure flags.
 */
const BASE_OPTS = {
	httpOnly: true,
	secure: env.isProd,
	sameSite: "lax",
	path: "/api/v1/auth",
} as const;

export function setRefreshCookie(res: Response, token: string): void {
	res.cookie(COOKIE_NAMES.REFRESH_TOKEN, token, {
		...BASE_OPTS,
		maxAge: REFRESH_TTL_MS,
	});
}

export function clearRefreshCookie(res: Response): void {
	res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, BASE_OPTS);
}
