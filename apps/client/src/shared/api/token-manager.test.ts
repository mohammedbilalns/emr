import { beforeEach, describe, expect, it, vi } from "vitest";
import { tokenManager } from "./token-manager";

describe("tokenManager", () => {
	beforeEach(() => {
		tokenManager.clearToken();
	});

	it("initializes with null token", () => {
		expect(tokenManager.getToken()).toBeNull();
	});

	it("stores and retrieves an access token", () => {
		tokenManager.setToken("sample-access-token-123");
		expect(tokenManager.getToken()).toBe("sample-access-token-123");
	});

	it("clears the active access token", () => {
		tokenManager.setToken("sample-access-token-123");
		tokenManager.clearToken();
		expect(tokenManager.getToken()).toBeNull();
	});

	it("notifies subscribers when token changes and unsubscribes cleanly", () => {
		const listener = vi.fn();
		const unsubscribe = tokenManager.subscribe(listener);

		tokenManager.setToken("token-a");
		expect(listener).toHaveBeenCalledWith("token-a");

		tokenManager.setToken("token-b");
		expect(listener).toHaveBeenCalledWith("token-b");

		unsubscribe();
		tokenManager.setToken("token-c");
		expect(listener).not.toHaveBeenCalledWith("token-c");
	});
});
