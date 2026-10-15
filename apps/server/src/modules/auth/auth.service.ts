import type { AuthUser, LoginBody } from "@emr/shared";
import { AUDIT_ACTIONS, ErrorMessages } from "../../config/constants";
import { UnauthorizedError } from "../../errors/base.error";
import { comparePassword, DUMMY_HASH } from "../../utils/hash";
import {
	hashToken,
	REFRESH_TTL_MS,
	signAccessToken,
	signRefreshToken,
	verifyRefreshToken,
} from "../../utils/jwt";
import { audit } from "../audit";
import { RefreshToken } from "./refresh-token.model";
import { toAuthUser } from "./to-auth-user";
import { User, type UserDocument } from "./user.model";

async function issueTokenPair(
	user: UserDocument,
): Promise<{ accessToken: string; refreshToken: string }> {
	const accessToken = signAccessToken({
		sub: user.id,
		role: user.role,
		email: user.email,
	});
	const refreshToken = signRefreshToken(user.id);

	await RefreshToken.create({
		user: user._id,
		tokenHash: hashToken(refreshToken),
		expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
	});

	return { accessToken, refreshToken };
}

/**
 * Authenticates user credentials with timing-safe comparison and issues session tokens.
 */
export async function login(
	body: LoginBody,
): Promise<{ user: AuthUser; accessToken: string; refreshToken: string }> {
	const user = await User.findOne({ email: body.email }).select(
		"+passwordHash",
	);

	// Generic message and dummy hash comparison to prevent user enumeration via timing
	const passwordOk = await comparePassword(
		body.password,
		user?.passwordHash ?? DUMMY_HASH,
	);
	if (!user?.isActive || !passwordOk) {
		await audit({
			role: "SYSTEM",
			action: AUDIT_ACTIONS.LOGIN_FAILED,
			entity: "User",
			details: { email: body.email },
		});
		throw new UnauthorizedError(ErrorMessages.INVALID_CREDENTIALS);
	}

	const tokens = await issueTokenPair(user);
	await audit({
		userId: user.id,
		role: user.role,
		action: AUDIT_ACTIONS.LOGIN,
		entity: "User",
		entityId: user.id,
	});

	return { user: toAuthUser(user), ...tokens };
}

/**
 * Rotates an active refresh token and returns a new session token pair.
 */
export async function refresh(
	token: string,
): Promise<{ user: AuthUser; accessToken: string; refreshToken: string }> {
	const payload = verifyRefreshToken(token);

	const claimed = await RefreshToken.findOneAndUpdate(
		{ tokenHash: hashToken(token), revokedAt: null },
		{ $set: { revokedAt: new Date() } },
	);
	if (!claimed) {
		throw new UnauthorizedError(ErrorMessages.INVALID_REFRESH_TOKEN);
	}

	const user = await User.findById(payload.sub);
	if (!user?.isActive) {
		throw new UnauthorizedError(ErrorMessages.INVALID_REFRESH_TOKEN);
	}

	const tokens = await issueTokenPair(user);
	await audit({
		userId: user.id,
		role: user.role,
		action: AUDIT_ACTIONS.TOKEN_REFRESHED,
		entity: "User",
		entityId: user.id,
	});

	return { user: toAuthUser(user), ...tokens };
}

/**
 * Revokes an active refresh token session and logs the audit event.
 */
export async function logout(
	token: string | undefined,
	actor: AuthUser,
): Promise<void> {
	if (token) {
		await RefreshToken.findOneAndUpdate(
			{ tokenHash: hashToken(token), revokedAt: null },
			{ $set: { revokedAt: new Date() } },
		).catch(() => null);
	}
	await audit({
		userId: actor.id,
		role: actor.role,
		action: AUDIT_ACTIONS.LOGOUT,
		entity: "User",
		entityId: actor.id,
	});
}
