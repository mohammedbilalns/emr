import type { AppointmentDto, CreateAppointmentBody } from "@emr/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	ApiClientError,
	getErrorMessage,
} from "../../../shared/api/api-errors";
import { useToast } from "../../../shared/hooks/use-toast";
import { bookAppointmentApi } from "../api/scheduler.api";

export function useBookSlot(onSuccessCallback?: () => void) {
	const queryClient = useQueryClient();
	const toast = useToast();

	return useMutation<AppointmentDto, unknown, CreateAppointmentBody>({
		mutationFn: (body: CreateAppointmentBody) => bookAppointmentApi(body),
		onSuccess: (_data, variables) => {
			toast.success(
				`Appointment confirmed for ${variables.startTime}`,
				"Booking Confirmed",
			);

			// Invalidate relevant caches
			void queryClient.invalidateQueries({
				queryKey: ["slots", variables.doctorId, variables.date],
			});
			void queryClient.invalidateQueries({ queryKey: ["appointments"] });
			void queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });

			if (onSuccessCallback) {
				onSuccessCallback();
			}
		},
		onError: (error, variables) => {
			// Specific handling for 409 conflict
			if (error instanceof ApiClientError && error.statusCode === 409) {
				toast.warning(
					"This appointment time was just booked. Please choose another available time.",
					"Time Slot Unavailable",
				);
				void queryClient.invalidateQueries({
					queryKey: ["slots", variables.doctorId, variables.date],
				});
				return;
			}

			const message = getErrorMessage(error, "Failed to book appointment");
			toast.error(message, "Booking Failed");
		},
	});
}
