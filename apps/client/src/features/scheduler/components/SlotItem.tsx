import type { SlotDto } from "@emr/shared";
import { Check, Clock, Lock } from "lucide-react";
import React from "react";

export interface SlotItemProps {
	slot: SlotDto;
	isSelected: boolean;
	isPast: boolean;
	onSelect: (slot: SlotDto) => void;
}

export const SlotItem = React.memo(function SlotItem({
	slot,
	isSelected,
	isPast,
	onSelect,
}: SlotItemProps) {
	const isBooked = slot.status === "BOOKED";
	const isDisabled = isBooked || isPast;

	let style =
		"border-slate-200 bg-white hover:border-teal-600 hover:bg-teal-50/50 text-slate-800 shadow-2xs";

	if (isSelected) {
		style =
			"border-teal-700 bg-teal-700 text-white shadow-sm ring-2 ring-teal-700/20";
	} else if (isBooked) {
		style =
			"border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed line-through";
	} else if (isPast) {
		style =
			"border-dashed border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed opacity-60";
	}

	return (
		<button
			type="button"
			disabled={isDisabled}
			onClick={() => onSelect(slot)}
			className={`flex items-center justify-between px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl border text-xs font-medium transition-all duration-150 cursor-pointer ${style}`}
			title={
				isBooked
					? "Slot is already booked"
					: isPast
						? "Slot time has passed"
						: `${slot.startTime} - ${slot.endTime}`
			}
		>
			<span className="font-mono font-semibold">{slot.startTime}</span>

			<div className="flex items-center gap-1 shrink-0">
				{isSelected ? (
					<Check className="h-3.5 w-3.5" />
				) : isBooked ? (
					<Lock className="h-3 w-3 text-slate-400" />
				) : isPast ? (
					<Clock className="h-3 w-3 text-slate-400" />
				) : (
					<span className="text-[10px] uppercase font-semibold text-teal-700">
						Open
					</span>
				)}
			</div>
		</button>
	);
});
