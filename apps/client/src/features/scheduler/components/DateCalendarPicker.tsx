import { Calendar as CalendarIcon } from "lucide-react";

export interface DateCalendarPickerProps {
	selectedDate: string;
	onDateChange: (date: string) => void;
	disabled?: boolean;
}

export function DateCalendarPicker({
	selectedDate,
	onDateChange,
	disabled = false,
}: DateCalendarPickerProps) {
	// Format today as YYYY-MM-DD in local time
	const now = new Date();
	const todayString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

	const tomorrow = new Date();
	tomorrow.setDate(tomorrow.getDate() + 1);
	const tomorrowString = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;

	return (
		<div className="flex flex-col gap-1.5 w-full">
			<label
				htmlFor="scheduler-date"
				className="text-xs font-semibold text-slate-700 tracking-wide flex items-center justify-between"
			>
				<span>Appointment Date</span>
				<span className="text-[11px] font-normal text-slate-400">
					YYYY-MM-DD
				</span>
			</label>

			<div className="flex flex-col sm:flex-row sm:items-center gap-2">
				<div className="relative flex-1 min-w-0">
					<div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
						<CalendarIcon className="h-4 w-4" />
					</div>
					<input
						id="scheduler-date"
						type="date"
						value={selectedDate}
						min={todayString}
						disabled={disabled}
						onChange={(e) => onDateChange(e.target.value)}
						className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm text-slate-900 transition-colors focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-50 disabled:text-slate-400"
					/>
				</div>

				<div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 shrink-0">
					<button
						type="button"
						onClick={() => onDateChange(todayString)}
						className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer text-center ${
							selectedDate === todayString
								? "bg-teal-50 border-teal-300 text-teal-800 font-semibold"
								: "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
						}`}
					>
						Today
					</button>

					<button
						type="button"
						onClick={() => onDateChange(tomorrowString)}
						className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer text-center ${
							selectedDate === tomorrowString
								? "bg-teal-50 border-teal-300 text-teal-800 font-semibold"
								: "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
						}`}
					>
						Tomorrow
					</button>
				</div>
			</div>
		</div>
	);
}
