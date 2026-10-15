import type { ReactNode } from "react";

export interface BadgeProps {
	children: ReactNode;
	variant?: "default" | "success" | "warning" | "danger" | "info" | "purple";
	size?: "sm" | "md";
	dot?: boolean;
	className?: string;
}

export function Badge({
	children,
	variant = "default",
	size = "sm",
	dot = false,
	className = "",
}: BadgeProps) {
	const variantStyles = {
		default: "bg-slate-100 text-slate-700 border-slate-200",
		success: "bg-emerald-50 text-emerald-800 border-emerald-200",
		warning: "bg-amber-50 text-amber-800 border-amber-200",
		danger: "bg-rose-50 text-rose-800 border-rose-200",
		info: "bg-teal-50 text-teal-800 border-teal-200",
		purple: "bg-indigo-50 text-indigo-800 border-indigo-200",
	};

	const dotStyles = {
		default: "bg-slate-400",
		success: "bg-emerald-500",
		warning: "bg-amber-500",
		danger: "bg-rose-500",
		info: "bg-teal-500",
		purple: "bg-indigo-500",
	};

	const sizeStyles = {
		sm: "text-xs px-2 py-0.5 gap-1.5",
		md: "text-sm px-2.5 py-1 gap-2",
	};

	return (
		<span
			className={`inline-flex items-center font-medium rounded-full border ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
		>
			{dot && (
				<span
					className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotStyles[variant]}`}
				/>
			)}
			<span>{children}</span>
		</span>
	);
}
