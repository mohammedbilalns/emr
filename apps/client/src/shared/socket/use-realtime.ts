import type {
	AppointmentCancelledEvent,
	AppointmentCreatedEvent,
	AppointmentUpdatedEvent,
	SlotBookedEvent,
	SlotDto,
	SlotReleasedEvent,
} from "@emr/shared";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { connectSocket, getSocket } from "./socket";

/**
 * Hook to monitor the real-time WebSocket connection status.
 */
export function useSocketConnected(): boolean {
	const [connected, setConnected] = useState(() => getSocket().connected);

	useEffect(() => {
		const socket = getSocket();

		const onConnect = () => setConnected(true);
		const onDisconnect = () => setConnected(false);

		socket.on("connect", onConnect);
		socket.on("disconnect", onDisconnect);

		// Initialize state in case already connected
		setConnected(socket.connected);

		return () => {
			socket.off("connect", onConnect);
			socket.off("disconnect", onDisconnect);
		};
	}, []);

	return connected;
}

/**
 * Initializes the real-time socket connection when authenticated and
 * listens to global appointment lifecycle events to synchronize React Query cache.
 */
export function useRealtimeGlobal(): { isConnected: boolean } {
	const queryClient = useQueryClient();
	const { user } = useAuth();
	const isConnected = useSocketConnected();

	useEffect(() => {
		if (!user) return;

		connectSocket();
		const socket = getSocket();

		const handleAppointmentCreated = (event: AppointmentCreatedEvent) => {
			// Invalidate all active appointments queries (dashboard queue, appointments page)
			void queryClient.invalidateQueries({ queryKey: ["appointments"] });
			// Also invalidate slots query if relevant
			void queryClient.invalidateQueries({
				queryKey: ["slots", event.doctorId, event.date],
			});
		};

		const handleAppointmentUpdated = (event: AppointmentUpdatedEvent) => {
			void queryClient.invalidateQueries({ queryKey: ["appointments"] });
			void queryClient.invalidateQueries({
				queryKey: ["slots", event.doctorId, event.date],
			});
		};

		const handleAppointmentCancelled = (event: AppointmentCancelledEvent) => {
			void queryClient.invalidateQueries({ queryKey: ["appointments"] });
			void queryClient.invalidateQueries({
				queryKey: ["slots", event.doctorId, event.date],
			});
		};

		socket.on("appointment:created", handleAppointmentCreated);
		socket.on("appointment:updated", handleAppointmentUpdated);
		socket.on("appointment:cancelled", handleAppointmentCancelled);

		return () => {
			socket.off("appointment:created", handleAppointmentCreated);
			socket.off("appointment:updated", handleAppointmentUpdated);
			socket.off("appointment:cancelled", handleAppointmentCancelled);
		};
	}, [user, queryClient]);

	return { isConnected };
}

/**
 * Subscribes the client to targeted real-time slot updates for a doctor's schedule on a specific date.
 */
export function useSchedulerRoom(
	doctorId: string,
	date: string,
): { isConnected: boolean } {
	const queryClient = useQueryClient();
	const isConnected = useSocketConnected();

	useEffect(() => {
		if (!doctorId || !date) return;

		const socket = getSocket();
		if (!socket.connected) {
			connectSocket();
		}

		// Join room for this doctor and date
		socket.emit("scheduler:join", { doctorId, date });

		const handleSlotBooked = (event: SlotBookedEvent) => {
			if (event.doctorId !== doctorId || event.date !== date) return;

			// Optimistically patch local cache for immediate zero-latency feedback
			queryClient.setQueryData<SlotDto[]>(
				["slots", doctorId, date],
				(oldSlots) => {
					if (!oldSlots) return oldSlots;
					return oldSlots.map((slot) =>
						slot.startTime === event.startTime
							? {
									...slot,
									status: "BOOKED",
									appointmentId: event.appointmentId,
								}
							: slot,
					);
				},
			);

			// Invalidate to guarantee full data consistency with the server
			void queryClient.invalidateQueries({
				queryKey: ["slots", doctorId, date],
			});
		};

		const handleSlotReleased = (event: SlotReleasedEvent) => {
			if (event.doctorId !== doctorId || event.date !== date) return;

			// Optimistically patch local cache to available
			queryClient.setQueryData<SlotDto[]>(
				["slots", doctorId, date],
				(oldSlots) => {
					if (!oldSlots) return oldSlots;
					return oldSlots.map((slot) =>
						slot.startTime === event.startTime
							? {
									...slot,
									status: "AVAILABLE",
									appointmentId: undefined,
								}
							: slot,
					);
				},
			);

			// Invalidate to guarantee full data consistency
			void queryClient.invalidateQueries({
				queryKey: ["slots", doctorId, date],
			});
		};

		socket.on("slot:booked", handleSlotBooked);
		socket.on("slot:released", handleSlotReleased);

		return () => {
			socket.emit("scheduler:leave", { doctorId, date });
			socket.off("slot:booked", handleSlotBooked);
			socket.off("slot:released", handleSlotReleased);
		};
	}, [doctorId, date, queryClient]);

	return { isConnected };
}
