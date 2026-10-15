import { type SlotDto, toMinutes } from "@emr/shared";
import { CalendarX, Moon, Sun, Sunrise } from "lucide-react";
import React, { useMemo } from "react";
import { EmptyState } from "../../../shared/components/ui/EmptyState";
import { Spinner } from "../../../shared/components/ui/Spinner";
import { SlotItem } from "./SlotItem";

export interface SlotGridProps {
	slots: SlotDto[];
	selectedDate: string;
	selectedSlot: SlotDto | null;
	onSelectSlot: (slot: SlotDto) => void;
	isLoading: boolean;
}

export const SlotGrid = React.memo(function SlotGrid({
	slots,
	selectedDate,
	selectedSlot,
	onSelectSlot,
	isLoading,
}: SlotGridProps) {
	// Check if date is today and calculate current minutes
	const { isToday, currentMinutes } = useMemo(() => {
		const now = new Date();
		const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
		const isCurrentDay = selectedDate === todayStr;
		const minutes = now.getHours() * 60 + now.getMinutes();
		return { isToday: isCurrentDay, currentMinutes: minutes };
	}, [selectedDate]);

	// Segment slots by clinical time periods
	const { morningSlots, afternoonSlots, eveningSlots, availableCount } =
		useMemo(() => {
			const morning: SlotDto[] = [];
			const afternoon: SlotDto[] = [];
			const evening: SlotDto[] = [];
			let available = 0;

			for (const slot of slots) {
				const slotMins = toMinutes(slot.startTime);
				const isPast = isToday && slotMins <= currentMinutes;

				if (slot.status === "AVAILABLE" && !isPast) {
					available++;
				}

				if (slotMins < 12 * 60) {
					morning.push(slot);
				} else if (slotMins < 17 * 60) {
					afternoon.push(slot);
				} else {
					evening.push(slot);
				}
			}

			return {
				morningSlots: morning,
				afternoonSlots: afternoon,
				eveningSlots: evening,
				availableCount: available,
			};
		}, [slots, isToday, currentMinutes]);

	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center p-12 gap-3 min-h-[300px]">
				<Spinner size="lg" className="text-teal-700" />
				<span className="text-xs font-medium text-slate-500">
					Loading available consultation times...
				</span>
			</div>
		);
	}

	if (slots.length === 0) {
		return (
			<EmptyState
				icon={<CalendarX className="h-6 w-6 text-slate-400" />}
				title="No Available Appointments"
				description="The selected doctor has no consultation hours on this date. Please choose another date or doctor."
			/>
		);
	}

	const renderSessionGroup = (
		title: string,
		icon: React.ReactNode,
		sessionSlots: SlotDto[],
	) => {
		if (sessionSlots.length === 0) return null;

		return (
			<div className="flex flex-col gap-3">
				<div className="flex items-center gap-2 text-xs font-semibold text-slate-700 pb-1 border-b border-slate-100">
					{icon}
					<span>{title}</span>
					<span className="text-[11px] font-normal text-slate-400">
						({sessionSlots.length} times)
					</span>
				</div>

				<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
					{sessionSlots.map((slot) => {
						const slotMins = toMinutes(slot.startTime);
						const isPast = isToday && slotMins <= currentMinutes;
						const isSelected = selectedSlot?.startTime === slot.startTime;

						return (
							<SlotItem
								key={slot.startTime}
								slot={slot}
								isSelected={isSelected}
								isPast={isPast}
								onSelect={onSelectSlot}
							/>
						);
					})}
				</div>
			</div>
		);
	};

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 px-3.5 py-2 rounded-lg border border-slate-200/60">
				<span>
					<span className="font-semibold">{slots.length}</span> consultation
					times
				</span>
				<span className="font-semibold text-teal-800">
					{availableCount} Available to Book
				</span>
			</div>

			{renderSessionGroup(
				"Morning Session",
				<Sunrise className="h-4 w-4 text-amber-500" />,
				morningSlots,
			)}

			{renderSessionGroup(
				"Afternoon Session",
				<Sun className="h-4 w-4 text-orange-500" />,
				afternoonSlots,
			)}

			{renderSessionGroup(
				"Evening Session",
				<Moon className="h-4 w-4 text-indigo-500" />,
				eveningSlots,
			)}
		</div>
	);
});
