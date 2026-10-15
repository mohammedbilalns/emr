export function SlotLegend() {
	return (
		<div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 py-2 border-y border-slate-100">
			<span className="font-semibold text-slate-800 text-[11px] uppercase tracking-wider">
				Legend:
			</span>

			<div className="flex items-center gap-1.5">
				<span className="h-3 w-3 rounded-md bg-white border-2 border-teal-600" />
				<span>Available</span>
			</div>

			<div className="flex items-center gap-1.5">
				<span className="h-3 w-3 rounded-md bg-teal-700 text-white" />
				<span>Selected</span>
			</div>

			<div className="flex items-center gap-1.5">
				<span className="h-3 w-3 rounded-md bg-slate-200 border border-slate-300" />
				<span>Booked</span>
			</div>

			<div className="flex items-center gap-1.5">
				<span className="h-3 w-3 rounded-md bg-slate-100 opacity-60 border border-dashed border-slate-300" />
				<span>Past / Unavailable</span>
			</div>
		</div>
	);
}
