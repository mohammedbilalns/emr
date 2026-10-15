import type { ReactNode } from "react";

export interface EmptyStateProps {
	icon?: ReactNode;
	title: string;
	description?: string;
	action?: ReactNode;
	className?: string;
}

export function EmptyState({
	icon,
	title,
	description,
	action,
	className = "",
}: EmptyStateProps) {
	return (
		<div
			className={`flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 ${className}`}
		>
			{icon && (
				<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500 mb-3 shadow-xs">
					{icon}
				</div>
			)}
			<h4 className="text-sm font-semibold text-slate-900 tracking-tight">
				{title}
			</h4>
			{description && (
				<p className="text-xs text-slate-500 max-w-sm mt-1 mb-4 leading-relaxed">
					{description}
				</p>
			)}
			{action && <div className="mt-1">{action}</div>}
		</div>
	);
}
