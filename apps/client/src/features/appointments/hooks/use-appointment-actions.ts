import type { UpdateAppointmentBody } from "@emr/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getErrorMessage } from "../../../shared/api/api-errors";
import { useToast } from "../../../shared/hooks/use-toast";
import {
	cancelAppointmentApi,
	completeAppointmentApi,
	markArrivedApi,
	updateAppointmentApi,
} from "../api/appointments.api";

export function useAppointmentActions() {
	const queryClient = useQueryClient();
	const toast = useToast();

	const invalidateAll = () => {
		void queryClient.invalidateQueries({ queryKey: ["appointments"] });
		void queryClient.invalidateQueries({ queryKey: ["slots"] });
		void queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
	};

	const markArrivedMutation = useMutation({
		mutationFn: (id: string) => markArrivedApi(id),
		onSuccess: () => {
			toast.success("Patient marked as arrived at clinic", "Status Updated");
			invalidateAll();
		},
		onError: (error) => {
			toast.error(
				getErrorMessage(error, "Failed to update arrival status"),
				"Status Error",
			);
		},
	});

	const completeMutation = useMutation({
		mutationFn: (id: string) => completeAppointmentApi(id),
		onSuccess: () => {
			toast.success(
				"Consultation marked as completed",
				"Appointment Completed",
			);
			invalidateAll();
		},
		onError: (error) => {
			toast.error(
				getErrorMessage(error, "Failed to complete appointment"),
				"Status Error",
			);
		},
	});

	const cancelMutation = useMutation({
		mutationFn: (id: string) => cancelAppointmentApi(id),
		onSuccess: () => {
			toast.info(
				"Appointment has been cancelled. The slot is now re-opened for booking.",
				"Appointment Cancelled",
			);
			invalidateAll();
		},
		onError: (error) => {
			toast.error(
				getErrorMessage(error, "Failed to cancel appointment"),
				"Cancellation Error",
			);
		},
	});

	const updateMutation = useMutation({
		mutationFn: ({ id, body }: { id: string; body: UpdateAppointmentBody }) =>
			updateAppointmentApi(id, body),
		onSuccess: () => {
			toast.success("Consultation notes & purpose saved", "Updated");
			invalidateAll();
		},
		onError: (error) => {
			toast.error(
				getErrorMessage(error, "Failed to save appointment notes"),
				"Update Error",
			);
		},
	});

	return {
		markArrived: markArrivedMutation.mutate,
		isMarkingArrived: markArrivedMutation.isPending,
		completeAppointment: completeMutation.mutate,
		isCompleting: completeMutation.isPending,
		cancelAppointment: cancelMutation.mutate,
		isCancelling: cancelMutation.isPending,
		updateAppointment: updateMutation.mutate,
		isUpdating: updateMutation.isPending,
	};
}
