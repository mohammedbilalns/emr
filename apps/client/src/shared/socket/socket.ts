import type { ClientToServerEvents, ServerToClientEvents } from "@emr/shared";
import { io, type Socket } from "socket.io-client";
import { tokenManager } from "../api/token-manager";

export type EMRClientSocket = Socket<
	ServerToClientEvents,
	ClientToServerEvents
>;

let socketInstance: EMRClientSocket | null = null;
let isSubscribedToTokenManager = false;

/**
 * Returns the singleton Socket.IO client instance configured with typed events and in-memory auth.
 */
export function getSocket(): EMRClientSocket {
	if (!socketInstance) {
		socketInstance = io({
			autoConnect: false,
			transports: ["websocket", "polling"],
			auth: (cb) => {
				cb({ token: tokenManager.getToken() });
			},
		});

		// Keep socket auth payload in sync with token rotation in memory
		if (!isSubscribedToTokenManager) {
			tokenManager.subscribe((token) => {
				if (!socketInstance) return;
				socketInstance.auth = { token };
				if (token && !socketInstance.connected) {
					socketInstance.connect();
				} else if (!token && socketInstance.connected) {
					socketInstance.disconnect();
				}
			});
			isSubscribedToTokenManager = true;
		}
	}

	return socketInstance;
}

/**
 * Connects the real-time socket if an access token is available.
 */
export function connectSocket(): void {
	const token = tokenManager.getToken();
	if (!token) return;

	const socket = getSocket();
	socket.auth = { token };
	if (!socket.connected) {
		socket.connect();
	}
}

/**
 * Disconnects the real-time socket cleanly.
 */
export function disconnectSocket(): void {
	if (socketInstance?.connected) {
		socketInstance.disconnect();
	}
}
