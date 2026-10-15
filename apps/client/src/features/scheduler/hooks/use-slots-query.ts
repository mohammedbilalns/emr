import { useQuery } from "@tanstack/react-query";
import { getSlotsApi } from "../api/scheduler.api";

/**
 * Fetches consultation slots for a doctor on a given date.
 * Automatically polls every 15 seconds to keep availability status fresh.
 */
export function useSlotsQuery(doctorId: string, date: string) {
	return useQuery({
		queryKey: ["slots", doctorId, date],
		queryFn: () => getSlotsApi(doctorId, date),
		enabled: Boolean(doctorId && date),
		staleTime: 10_000,
		refetchInterval: 15_000,
	});
}
