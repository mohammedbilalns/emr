import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Spinner } from "./Spinner";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
	size?: "sm" | "md" | "lg";
	isLoading?: boolean;
	leftIcon?: ReactNode;
	rightIcon?: ReactNode;
}

export function Button({
	children,
	variant = "primary",
	size = "md",
	isLoading = false,
	leftIcon,
	rightIcon,
	disabled,
	className = "",
	type = "button",
	...props
}: ButtonProps) {
	const baseStyles =
		"inline-flex items-center justify-center font-medium transition-all duration-150 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer";

	const sizeStyles = {
		sm: "text-xs px-2.5 py-1.5 gap-1.5",
		md: "text-sm px-3.5 py-2 gap-2",
		lg: "text-base px-5 py-2.5 gap-2.5",
	};

	const variantStyles = {
		primary:
			"bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white shadow-xs focus-visible:ring-teal-600",
		secondary:
			"bg-slate-800 hover:bg-slate-900 active:bg-slate-950 text-white shadow-xs focus-visible:ring-slate-700",
		outline:
			"border border-slate-300 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 focus-visible:ring-slate-400",
		danger:
			"bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-xs focus-visible:ring-rose-500",
		ghost:
			"text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200 focus-visible:ring-slate-300",
	};

	return (
		<button
			type={type}
			disabled={disabled || isLoading}
			className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
			{...props}
		>
			{isLoading ? (
				<Spinner size={size === "lg" ? "md" : "sm"} />
			) : (
				leftIcon && <span className="shrink-0">{leftIcon}</span>
			)}
			<span>{children}</span>
			{!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
		</button>
	);
}
