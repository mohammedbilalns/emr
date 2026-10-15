import { createHash } from "node:crypto";
import type { Role } from "@emr/shared";
import type { Secret, SignOptions } from "jsonwebtoken";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

// ---------------------------------------------------------------------------
// JWT utility functions for signing, verifying, and hashing tokens.
// ---------------------------------------------------------------------------

// TTL unit constants for parseTtlMs validation.
// Seconds (s), minutes (m), hours (h), days (d) map to millisecond values.
const TTL_UNITS = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 } as const;
export const REFRESH_TTL_MS = parseTtlMs(env.JWT_REFRESH_TTL);

export interface AccessTokenPayload {
	// JWT payload claims: subject, role, and email for access token identification
	sub: string;
	role: Role;
	email: string;
}

export interface RefreshTokenPayload {
	// JWT payload claim: subject (user ID) for refresh token identification
	sub: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
	return jwt.sign(
		payload,
		env.JWT_ACCESS_SECRET as Secret,
		{
			expiresIn: env.JWT_ACCESS_TTL,
		} as SignOptions,
	);
}

export function signRefreshToken(userId: string): string {
	return jwt.sign(
		{ sub: userId },
		env.JWT_REFRESH_SECRET as Secret,
		{
			expiresIn: env.JWT_REFRESH_TTL,
		} as SignOptions,
	);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
	return jwt.verify(
		token,
		env.JWT_ACCESS_SECRET as Secret,
	) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
	return jwt.verify(
		token,
		env.JWT_REFRESH_SECRET as Secret,
	) as RefreshTokenPayload;
}

export function hashToken(token: string): string {
	return createHash("sha256").update(token).digest("hex");
}

export function parseTtlMs(ttl: string): number {
	const match = /^(\d+)([smhd])$/.exec(ttl);
	if (!match) throw new Error(`Invalid TTL format: ${ttl}`);
	return Number(match[1]) * TTL_UNITS[match[2] as keyof typeof TTL_UNITS];
}
