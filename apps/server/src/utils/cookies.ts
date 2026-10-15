import type { Response } from "express";
import { COOKIE_NAMES } from "../config/constants";
import { env } from "../config/env";
import { REFRESH_TTL_MS } from "./jwt";

// ---------------------------------------------------------------------------
// Cookie utility functions for refresh token management.
// ---------------------------------------------------------------------------

const BASE_OPTS = {
	httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
	secure: env.isProd, // HTTPS-only in production; lax in development
	sameSite: "lax",
	path: "/api/v1/auth", // Scope the cookie to the API base path
} as const;

// ---------------------------------------------------------------------------
// Sets the refresh token cookie on the response object.
// ---------------------------------------------------------------------------
export function setRefreshCookie(res: Response, token: string): void {
	res.cookie(COOKIE_NAMES.REFRESH_TOKEN, token, {
		...BASE_OPTS,
		maxAge: REFRESH_TTL_MS,
	});
}

// ---------------------------------------------------------------------------
// Clears the refresh token cookie by setting its max-age to zero.
// ---------------------------------------------------------------------------
export function clearRefreshCookie(res: Response): void {
	res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, BASE_OPTS);
}
