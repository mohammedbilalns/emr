import type { Server as HttpServer } from "node:http";
import type {
	AppointmentCancelledEvent,
	AppointmentCreatedEvent,
	AppointmentUpdatedEvent,
	ClientToServerEvents,
	ServerToClientEvents,
} from "@emr/shared";
import { Server } from "socket.io";
import { env } from "../config/env";
import logger from "../logging/logger";
import { appointmentEvents } from "../modules/appointments";
import { type AccessTokenPayload, verifyAccessToken } from "../utils/jwt";

export interface SocketData {
	user?: AccessTokenPayload;
}

export type EMRSocketServer = Server<
	ClientToServerEvents,
	ServerToClientEvents,
	Record<string, never>,
	SocketData
>;

let ioInstance: EMRSocketServer | null = null;

// Persistent event listener references for clean teardown in tests
let onCreatedListener: ((event: AppointmentCreatedEvent) => void) | null = null;
let onUpdatedListener: ((event: AppointmentUpdatedEvent) => void) | null = null;
let onCancelledListener: ((event: AppointmentCancelledEvent) => void) | null =
	null;

/**
 * Initializes and binds the Socket.IO real-time server to the HTTP server.
 */
export function initSocketServer(httpServer: HttpServer): EMRSocketServer {
	if (ioInstance) {
		closeSocketServer();
	}

	const io: EMRSocketServer = new Server<
		ClientToServerEvents,
		ServerToClientEvents,
		Record<string, never>,
		SocketData
	>(httpServer, {
		cors: {
			origin: env.CLIENT_ORIGIN,
			credentials: true,
		},
		pingTimeout: 20000,
		pingInterval: 25000,
	});

	// Authenticate connecting sockets via JWT access token
	io.use((socket, next) => {
		const authHeader = socket.handshake.headers.authorization;
		const bearerToken = authHeader?.startsWith("Bearer ")
			? authHeader.slice(7)
			: undefined;
		const rawToken = socket.handshake.auth?.token;
		const token = typeof rawToken === "string" ? rawToken : bearerToken;

		if (!token) {
			logger.warn(
				{ socketId: socket.id },
				"Real-time socket connection rejected: Missing access token",
			);
			return next(new Error("Authentication token required"));
		}

		try {
			const payload = verifyAccessToken(token);
			socket.data.user = payload;
			next();
		} catch (error) {
			logger.warn(
				{ socketId: socket.id, err: error },
				"Real-time socket connection rejected: Invalid or expired token",
			);
			next(new Error("Invalid or expired authentication token"));
		}
	});

	io.on("connection", (socket) => {
		logger.info(
			{
				socketId: socket.id,
				userId: socket.data.user?.sub,
				role: socket.data.user?.role,
			},
			"Real-time client connected",
		);

		// Subscribe to a specific doctor & date schedule room
		socket.on("scheduler:join", ({ doctorId, date }) => {
			if (!doctorId || !date) return;
			const room = `scheduler:${doctorId}:${date}`;
			void socket.join(room);
			logger.debug(
				{ socketId: socket.id, room },
				"Client joined scheduler room",
			);
		});

		// Unsubscribe from a specific doctor & date schedule room
		socket.on("scheduler:leave", ({ doctorId, date }) => {
			if (!doctorId || !date) return;
			const room = `scheduler:${doctorId}:${date}`;
			void socket.leave(room);
			logger.debug({ socketId: socket.id, room }, "Client left scheduler room");
		});

		socket.on("disconnect", (reason) => {
			logger.info(
				{ socketId: socket.id, reason },
				"Real-time client disconnected",
			);
		});
	});

	// Bridge domain events from internal EventEmitter to Socket.IO clients
	onCreatedListener = (event: AppointmentCreatedEvent) => {
		// 1. Broadcast global appointment creation event for appointments lists & dashboard queues
		io.emit("appointment:created", event);

		// 2. Targeted update for clients viewing this doctor's schedule on this date
		io.to(`scheduler:${event.doctorId}:${event.date}`).emit("slot:booked", {
			doctorId: event.doctorId,
			date: event.date,
			startTime: event.startTime,
			endTime: event.endTime,
			appointmentId: event.appointment.id,
		});

		logger.debug(
			{ appointmentId: event.appointment.id, doctorId: event.doctorId },
			"Broadcast appointment:created and slot:booked",
		);
	};

	onUpdatedListener = (event: AppointmentUpdatedEvent) => {
		// Broadcast update to all connected clinical and administrative users
		io.emit("appointment:updated", event);

		logger.debug(
			{ appointmentId: event.appointment.id, status: event.status },
			"Broadcast appointment:updated",
		);
	};

	onCancelledListener = (event: AppointmentCancelledEvent) => {
		// 1. Broadcast global cancellation event
		io.emit("appointment:cancelled", event);

		// 2. Targeted release notification for scheduler grid
		io.to(`scheduler:${event.doctorId}:${event.date}`).emit("slot:released", {
			doctorId: event.doctorId,
			date: event.date,
			startTime: event.startTime,
			endTime: event.endTime,
		});

		logger.debug(
			{ appointmentId: event.appointment.id, doctorId: event.doctorId },
			"Broadcast appointment:cancelled and slot:released",
		);
	};

	appointmentEvents.on("appointment:created", onCreatedListener);
	appointmentEvents.on("appointment:updated", onUpdatedListener);
	appointmentEvents.on("appointment:cancelled", onCancelledListener);

	ioInstance = io;
	return io;
}

/**
 * Returns the active Socket.IO server instance, or null if not yet initialized.
 */
export function getSocketServer(): EMRSocketServer | null {
	return ioInstance;
}

/**
 * Cleanly closes the Socket.IO server and detaches event listeners.
 */
export function closeSocketServer(): void {
	if (onCreatedListener) {
		appointmentEvents.off("appointment:created", onCreatedListener);
		onCreatedListener = null;
	}
	if (onUpdatedListener) {
		appointmentEvents.off("appointment:updated", onUpdatedListener);
		onUpdatedListener = null;
	}
	if (onCancelledListener) {
		appointmentEvents.off("appointment:cancelled", onCancelledListener);
		onCancelledListener = null;
	}
	if (ioInstance) {
		ioInstance.close();
		ioInstance = null;
	}
}
