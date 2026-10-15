import { useQuery } from "@tanstack/react-query";
import { getSlotsApi } from "../api/scheduler.api";

/**
 * Fetches consultation slots for a doctor on a given date.
 * Automatically polls every 15 seconds to keep availability status fresh.
 * Suppresses queries for past dates to avoid redundant server validation errors.
 */
export function useSlotsQuery(doctorId: string, date: string) {
	const now = new Date();
	const todayString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
	const isValidDate = Boolean(date && date >= todayString);

	return useQuery({
		queryKey: ["slots", doctorId, date],
		queryFn: () => getSlotsApi(doctorId, date),
		enabled: Boolean(doctorId && isValidDate),
		staleTime: 10_000,
		refetchInterval: 15_000,
	});
}
