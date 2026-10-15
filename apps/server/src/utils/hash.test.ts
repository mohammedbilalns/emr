import { describe, expect, it } from "vitest";
import { comparePassword, DUMMY_HASH, hashPassword } from "./hash";

describe("hash utility", () => {
	it("hashes and correctly compares a plain password", async () => {
		const password = "SecurePassword@123";
		const hash = await hashPassword(password);

		expect(hash).toBeDefined();
		expect(typeof hash).toBe("string");
		expect(hash).not.toEqual(password);

		const isMatch = await comparePassword(password, hash);
		expect(isMatch).toBe(true);

		const isWrong = await comparePassword("WrongPassword", hash);
		expect(isWrong).toBe(false);
	});

	it("provides a valid DUMMY_HASH for timing attack neutralization", async () => {
		expect(DUMMY_HASH).toBeDefined();
		expect(typeof DUMMY_HASH).toBe("string");

		// Comparing against DUMMY_HASH should return false
		const result = await comparePassword("anyPassword", DUMMY_HASH);
		expect(result).toBe(false);
	});
});
