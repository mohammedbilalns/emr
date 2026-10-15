import { useQuery } from "@tanstack/react-query";
import { getSlotsApi } from "../api/scheduler.api";

export function useSlotsQuery(doctorId: string, date: string) {
	return useQuery({
		queryKey: ["slots", doctorId, date],
		queryFn: () => getSlotsApi(doctorId, date),
		enabled: Boolean(doctorId && date),
		staleTime: 10_000, // 10s fresh cache
		refetchInterval: 15_000, // background auto-polling every 15s to keep slots current
	});
}
