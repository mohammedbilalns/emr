import { createServer, type Server as HttpServer } from "node:http";
import type { AddressInfo } from "node:net";
import type {
	AppointmentCancelledEvent,
	AppointmentCreatedEvent,
	AppointmentUpdatedEvent,
	ClientToServerEvents,
	ServerToClientEvents,
	SlotBookedEvent,
	SlotReleasedEvent,
} from "@emr/shared";
import { io as ioClient, type Socket } from "socket.io-client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../../src/app";
import {
	emitAppointmentCancelled,
	emitAppointmentCreated,
	emitAppointmentUpdated,
} from "../../src/modules/appointments";
import { closeSocketServer, initSocketServer } from "../../src/sockets";
import { signAccessToken } from "../../src/utils/jwt";

type TypedClientSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

describe("Socket.IO Real-Time Gateway Integration", () => {
	let httpServer: HttpServer;
	let serverUrl: string;
	let validToken: string;
	const openSockets: TypedClientSocket[] = [];

	const createClient = (token?: string): TypedClientSocket => {
		const socket: TypedClientSocket = ioClient(serverUrl, {
			autoConnect: false,
			transports: ["websocket"],
			auth: token ? { token } : undefined,
		});
		openSockets.push(socket);
		return socket;
	};

	beforeAll(async () => {
		const app = createApp();
		httpServer = createServer(app);
		initSocketServer(httpServer);

		await new Promise<void>((resolve) => {
			httpServer.listen(0, () => {
				const addr = httpServer.address() as AddressInfo;
				serverUrl = `http://localhost:${addr.port}`;
				resolve();
			});
		});

		validToken = signAccessToken({
			sub: "user-123",
			email: "nurse@hospital.com",
			role: "RECEPTIONIST",
		});
	});

	afterAll(async () => {
		for (const socket of openSockets) {
			if (socket.connected) socket.disconnect();
		}
		closeSocketServer();
		await new Promise<void>((resolve) => httpServer.close(() => resolve()));
	});

	it("rejects connection when no authentication token is provided", async () => {
		const client = createClient();

		const error = await new Promise<string>((resolve) => {
			client.on("connect_error", (err) => resolve(err.message));
			client.connect();
		});

		expect(error).toMatch(/token required/i);
		expect(client.connected).toBe(false);
	});

	it("rejects connection when an invalid token is provided", async () => {
		const client = createClient("invalid-or-tampered-token");

		const error = await new Promise<string>((resolve) => {
			client.on("connect_error", (err) => resolve(err.message));
			client.connect();
		});

		expect(error).toMatch(/invalid or expired/i);
		expect(client.connected).toBe(false);
	});

	it("authenticates and connects successfully with a valid access token", async () => {
		const client = createClient(validToken);

		await new Promise<void>((resolve) => {
			client.on("connect", () => resolve());
			client.connect();
		});

		expect(client.connected).toBe(true);
	});

	it("broadcasts appointment:created globally and slot:booked to targeted scheduler room", async () => {
		const clientInRoom = createClient(validToken);
		const clientOtherRoom = createClient(validToken);
		const doctorId = "doc-alpha";
		const date = "2026-11-20";

		await Promise.all([
			new Promise<void>((resolve) => {
				clientInRoom.on("connect", () => resolve());
				clientInRoom.connect();
			}),
			new Promise<void>((resolve) => {
				clientOtherRoom.on("connect", () => resolve());
				clientOtherRoom.connect();
			}),
		]);

		// Join rooms
		clientInRoom.emit("scheduler:join", { doctorId, date });
		clientOtherRoom.emit("scheduler:join", {
			doctorId: "doc-beta",
			date: "2026-11-21",
		});

		// Small delay for room membership propagation
		await new Promise((r) => setTimeout(r, 50));

		let otherRoomReceivedSlot = false;
		clientOtherRoom.on("slot:booked", () => {
			otherRoomReceivedSlot = true;
		});

		const mockEvent: AppointmentCreatedEvent = {
			appointment: {
				id: "apt-101",
				doctor: { id: doctorId, name: "Dr. Smith", department: "Cardiology" },
				patient: {
					id: "p-1",
					patientCode: "P-100",
					name: "Alice Doe",
					mobile: "9876543210",
				},
				date,
				startTime: "09:00",
				endTime: "09:15",
				status: "SCHEDULED",
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			},
			doctorId,
			date,
			startTime: "09:00",
			endTime: "09:15",
		};

		const [globalReceived, roomReceived] = await Promise.all([
			new Promise<AppointmentCreatedEvent>((resolve) => {
				clientOtherRoom.on("appointment:created", (ev) => resolve(ev));
			}),
			new Promise<SlotBookedEvent>((resolve) => {
				clientInRoom.on("slot:booked", (ev) => resolve(ev));
			}),
			new Promise<void>((resolve) => {
				emitAppointmentCreated(mockEvent);
				resolve();
			}),
		]);

		expect(globalReceived.appointment.id).toBe("apt-101");
		expect(roomReceived.doctorId).toBe(doctorId);
		expect(roomReceived.startTime).toBe("09:00");
		expect(roomReceived.appointmentId).toBe("apt-101");
		expect(otherRoomReceivedSlot).toBe(false);
	});

	it("broadcasts appointment:updated globally to all connected clients", async () => {
		const client = createClient(validToken);

		await new Promise<void>((resolve) => {
			client.on("connect", () => resolve());
			client.connect();
		});

		const mockUpdateEvent: AppointmentUpdatedEvent = {
			appointment: {
				id: "apt-101",
				doctor: {
					id: "doc-alpha",
					name: "Dr. Smith",
					department: "Cardiology",
				},
				patient: {
					id: "p-1",
					patientCode: "P-100",
					name: "Alice Doe",
					mobile: "9876543210",
				},
				date: "2026-11-20",
				startTime: "09:00",
				endTime: "09:15",
				status: "ARRIVED",
				notes: "Patient arrived on time, vitals checked",
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			},
			doctorId: "doc-alpha",
			date: "2026-11-20",
			startTime: "09:00",
			endTime: "09:15",
			status: "ARRIVED",
		};

		const received = await new Promise<AppointmentUpdatedEvent>((resolve) => {
			client.on("appointment:updated", (ev) => resolve(ev));
			emitAppointmentUpdated(mockUpdateEvent);
		});

		expect(received.appointment.id).toBe("apt-101");
		expect(received.status).toBe("ARRIVED");
		expect(received.appointment.notes).toBe(
			"Patient arrived on time, vitals checked",
		);
	});

	it("broadcasts appointment:cancelled globally and slot:released to targeted scheduler room", async () => {
		const clientInRoom = createClient(validToken);
		const doctorId = "doc-alpha";
		const date = "2026-11-20";

		await new Promise<void>((resolve) => {
			clientInRoom.on("connect", () => resolve());
			clientInRoom.connect();
		});

		clientInRoom.emit("scheduler:join", { doctorId, date });
		await new Promise((r) => setTimeout(r, 50));

		const mockCancelEvent: AppointmentCancelledEvent = {
			appointment: {
				id: "apt-101",
				doctor: { id: doctorId, name: "Dr. Smith", department: "Cardiology" },
				patient: {
					id: "p-1",
					patientCode: "P-100",
					name: "Alice Doe",
					mobile: "9876543210",
				},
				date,
				startTime: "09:00",
				endTime: "09:15",
				status: "CANCELLED",
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			},
			doctorId,
			date,
			startTime: "09:00",
			endTime: "09:15",
		};

		const [globalCancelled, slotReleased] = await Promise.all([
			new Promise<AppointmentCancelledEvent>((resolve) => {
				clientInRoom.on("appointment:cancelled", (ev) => resolve(ev));
			}),
			new Promise<SlotReleasedEvent>((resolve) => {
				clientInRoom.on("slot:released", (ev) => resolve(ev));
			}),
			new Promise<void>((resolve) => {
				emitAppointmentCancelled(mockCancelEvent);
				resolve();
			}),
		]);

		expect(globalCancelled.appointment.id).toBe("apt-101");
		expect(slotReleased.doctorId).toBe(doctorId);
		expect(slotReleased.startTime).toBe("09:00");
	});
});
