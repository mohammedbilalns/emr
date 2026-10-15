import type { AuthUser, LoginBody } from "@emr/shared";
import bcrypt from "bcryptjs";
import { AUDIT_ACTIONS, ErrorMessages } from "../config/constants";
import { UnauthorizedError } from "../errors/base.error";
import { toAuthUser } from "../mappers/to-auth-user";
import { RefreshToken } from "../models/refresh-token.model";
import { User, type UserDocument } from "../models/user.model";
import { audit } from "../utils/audit";
import {
	hashToken,
	REFRESH_TTL_MS,
	signAccessToken,
	signRefreshToken,
	verifyRefreshToken,
} from "../utils/jwt";

// dummy hash to avoid timing attacks
const DUMMY_HASH = bcrypt.hashSync("timing-equalizer", 12);

// ---------------------------------------------------------------------------
// Creates a pair of access and refresh tokens for a given user and persists
// the refresh token hash in the database for later rotation/revocation.
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Authenticates a user by email and password.
// ---------------------------------------------------------------------------
export async function login(
	body: LoginBody,
): Promise<{ user: AuthUser; accessToken: string; refreshToken: string }> {
	const user = await User.findOne({ email: body.email }).select(
		"+passwordHash",
	);

	// ONE generic message for all failure modes — no user enumeration
	const passwordOk = await bcrypt.compare(
		body.password,
		user?.passwordHash ?? DUMMY_HASH,
	);
	if (!user || !user.isActive || !passwordOk) {
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

// ---------------------------------------------------------------------------
// Refreshes an access token using a valid refresh token.
// ---------------------------------------------------------------------------
export async function refresh(
	token: string,
): Promise<{ user: AuthUser; accessToken: string; refreshToken: string }> {
	const payload = verifyRefreshToken(token); // throws → 401 via error handler

	const claimed = await RefreshToken.findOneAndUpdate(
		{ tokenHash: hashToken(token), revokedAt: null },
		{ $set: { revokedAt: new Date() } },
	);
	if (!claimed) {
		throw new UnauthorizedError(ErrorMessages.INVALID_REFRESH_TOKEN);
	}

	const user = await User.findById(payload.sub);
	if (!user || !user.isActive) {
		throw new UnauthorizedError(ErrorMessages.INVALID_REFRESH_TOKEN);
	}

	const tokens = await issueTokenPair(user); //rotation
	await audit({
		userId: user.id,
		role: user.role,
		action: AUDIT_ACTIONS.TOKEN_REFRESHED,
		entity: "User",
		entityId: user.id,
	});

	return { user: toAuthUser(user), ...tokens };
}

// ---------------------------------------------------------------------------
// Revokes a refresh token by marking it as revoked in the database.
// ---------------------------------------------------------------------------
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
