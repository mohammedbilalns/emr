import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./Button";

export interface PaginationProps {
	page: number;
	totalPages: number;
	total?: number;
	limit?: number;
	onPageChange: (page: number) => void;
	className?: string;
}

export function Pagination({
	page,
	totalPages,
	total,
	limit,
	onPageChange,
	className = "",
}: PaginationProps) {
	if (totalPages <= 1 && (!total || total === 0)) return null;

	const startItem = limit ? (page - 1) * limit + 1 : undefined;
	const endItem =
		limit && total !== undefined
			? Math.min(page * limit, total)
			: limit
				? page * limit
				: undefined;

	return (
		<div
			className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white border-t border-slate-100 ${className}`}
		>
			<div className="text-xs text-slate-500">
				{total !== undefined && startItem && endItem ? (
					<span>
						Showing{" "}
						<span className="font-semibold text-slate-700">{startItem}</span> to{" "}
						<span className="font-semibold text-slate-700">{endItem}</span> of{" "}
						<span className="font-semibold text-slate-700">{total}</span>{" "}
						records
					</span>
				) : (
					<span>
						Page <span className="font-semibold text-slate-700">{page}</span> of{" "}
						<span className="font-semibold text-slate-700">
							{totalPages || 1}
						</span>
					</span>
				)}
			</div>

			<div className="flex items-center gap-1.5">
				<Button
					variant="outline"
					size="sm"
					onClick={() => onPageChange(page - 1)}
					disabled={page <= 1}
					leftIcon={<ChevronLeft className="h-3.5 w-3.5" />}
					aria-label="Previous page"
				>
					Previous
				</Button>

				<div className="hidden sm:flex items-center gap-1 px-1">
					{Array.from({ length: totalPages }, (_, i) => i + 1)
						.filter(
							(p) =>
								p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1),
						)
						.map((p, idx, arr) => {
							const prev = arr[idx - 1];
							const showEllipsis = prev && p - prev > 1;

							return (
								<div key={p} className="flex items-center">
									{showEllipsis && (
										<span className="px-1 text-xs text-slate-400">...</span>
									)}
									<button
										type="button"
										onClick={() => onPageChange(p)}
										className={`h-7 w-7 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
											page === p
												? "bg-teal-700 text-white font-semibold"
												: "text-slate-600 hover:bg-slate-100"
										}`}
									>
										{p}
									</button>
								</div>
							);
						})}
				</div>

				<Button
					variant="outline"
					size="sm"
					onClick={() => onPageChange(page + 1)}
					disabled={page >= totalPages}
					rightIcon={<ChevronRight className="h-3.5 w-3.5" />}
					aria-label="Next page"
				>
					Next
				</Button>
			</div>
		</div>
	);
}
