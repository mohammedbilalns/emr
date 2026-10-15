import type { AppointmentListQuery } from "@emr/shared";
import { useQuery } from "@tanstack/react-query";
import { listAppointmentsApi } from "../api/appointments.api";

export function useAppointmentsQuery(query: Partial<AppointmentListQuery>) {
	return useQuery({
		queryKey: ["appointments", query],
		queryFn: () => listAppointmentsApi(query),
		staleTime: 10_000,
	});
}
