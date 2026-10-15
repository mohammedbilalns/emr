import { describe, expect, it } from "vitest";
import {
	hashToken,
	parseTtlMs,
	signAccessToken,
	signRefreshToken,
	verifyAccessToken,
	verifyRefreshToken,
} from "./jwt";

describe("JWT Utility Functions", () => {
	describe("parseTtlMs", () => {
		it("parses seconds format", () => {
			expect(parseTtlMs("30s")).toBe(30_000);
		});

		it("parses minutes format", () => {
			expect(parseTtlMs("15m")).toBe(900_000);
		});

		it("parses hours format", () => {
			expect(parseTtlMs("2h")).toBe(7_200_000);
		});

		it("parses days format", () => {
			expect(parseTtlMs("7d")).toBe(604_800_000);
		});

		it("throws an error on invalid duration strings", () => {
			expect(() => parseTtlMs("10x")).toThrow(/Invalid TTL format/);
			expect(() => parseTtlMs("100")).toThrow(/Invalid TTL format/);
			expect(() => parseTtlMs("invalid")).toThrow(/Invalid TTL format/);
		});
	});

	describe("Access Token Lifecycle", () => {
		const payload = {
			sub: "507f1f77bcf86cd799439011",
			role: "DOCTOR" as const,
			email: "dr.chen@emr.local",
		};

		it("signs and verifies valid access tokens", () => {
			const token = signAccessToken(payload);
			expect(typeof token).toBe("string");

			const verified = verifyAccessToken(token);
			expect(verified.sub).toBe(payload.sub);
			expect(verified.role).toBe(payload.role);
			expect(verified.email).toBe(payload.email);
		});

		it("throws when verifying a tampered token signature", () => {
			const token = signAccessToken(payload);
			const tampered = `${token.slice(0, -6)}xxxxxx`;
			expect(() => verifyAccessToken(tampered)).toThrow();
		});
	});

	describe("Refresh Token Lifecycle", () => {
		const userId = "507f1f77bcf86cd799439012";

		it("signs and verifies refresh tokens with unique jti", () => {
			const token1 = signRefreshToken(userId);
			const token2 = signRefreshToken(userId);

			const verified1 = verifyRefreshToken(token1);
			const verified2 = verifyRefreshToken(token2);

			expect(verified1.sub).toBe(userId);
			expect(verified2.sub).toBe(userId);
			expect(verified1.jti).toBeDefined();
			expect(verified2.jti).toBeDefined();
			expect(verified1.jti).not.toBe(verified2.jti);
		});
	});

	describe("hashToken", () => {
		it("produces a 64-character hex SHA-256 digest", () => {
			const hash = hashToken("sample.token.string");
			expect(hash).toHaveLength(64);
			expect(/^[a-f0-9]{64}$/.test(hash)).toBe(true);
		});

		it("is deterministic for identical inputs", () => {
			const token = "consistent-refresh-token-123";
			expect(hashToken(token)).toBe(hashToken(token));
		});

		it("produces distinct digests for distinct tokens", () => {
			expect(hashToken("token-a")).not.toBe(hashToken("token-b"));
		});
	});
});
