import { describe, expect, it } from "vitest";
import { escapeRegex } from "./regex";

describe("Regex Utility", () => {
	it("leaves alphanumeric strings unchanged", () => {
		expect(escapeRegex("JohnDoe123")).toBe("JohnDoe123");
		expect(escapeRegex("Cardiology")).toBe("Cardiology");
	});

	it("escapes special regex characters", () => {
		expect(escapeRegex("Dr. House")).toBe("Dr\\. House");
		expect(escapeRegex("test*query?")).toBe("test\\*query\\?");
		expect(escapeRegex("[admin]")).toBe("\\[admin\\]");
		expect(escapeRegex("a+b=c^d$e")).toBe("a\\+b=c\\^d\\$e");
		expect(escapeRegex("one|two(three)")).toBe("one\\|two\\(three\\)");
		expect(escapeRegex("path\\to\\file")).toBe("path\\\\to\\\\file");
	});

	it("prevents regex syntax errors when creating dynamic RegExp objects", () => {
		const maliciousInputs = [
			"(unclosed bracket",
			"[a-z",
			"bad+*pattern",
			"???",
			"**",
			"{1,2",
		];

		for (const input of maliciousInputs) {
			const escaped = escapeRegex(input);
			expect(() => new RegExp(escaped)).not.toThrow();
		}
	});
});
