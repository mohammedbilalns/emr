import { beforeEach, describe, expect, it, vi } from "vitest";
import { tokenManager } from "../api/token-manager";
import { connectSocket, disconnectSocket, getSocket } from "./socket";

describe("Socket.IO client manager", () => {
	beforeEach(() => {
		tokenManager.clearToken();
		vi.clearAllMocks();
	});

	it("returns a singleton socket instance", () => {
		const s1 = getSocket();
		const s2 = getSocket();
		expect(s1).toBe(s2);
	});

	it("does not connect if no token exists in tokenManager", () => {
		const socket = getSocket();
		const connectSpy = vi.spyOn(socket, "connect");
		connectSocket();
		expect(connectSpy).not.toHaveBeenCalled();
	});

	it("connects when token is available", () => {
		tokenManager.setToken("test-jwt-token");
		const socket = getSocket();
		const connectSpy = vi
			.spyOn(socket, "connect")
			.mockImplementation(() => socket);
		connectSocket();
		expect(connectSpy).toHaveBeenCalled();
		expect(socket.auth).toEqual({ token: "test-jwt-token" });
	});

	it("disconnects when disconnectSocket is called and socket was connected", () => {
		const socket = getSocket();
		// Simulate connected state
		Object.defineProperty(socket, "connected", {
			value: true,
			configurable: true,
		});
		const disconnectSpy = vi
			.spyOn(socket, "disconnect")
			.mockImplementation(() => socket);
		disconnectSocket();
		expect(disconnectSpy).toHaveBeenCalled();
	});
});
