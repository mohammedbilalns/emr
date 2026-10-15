import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
	label?: string;
	error?: string;
	helperText?: string;
	leftIcon?: ReactNode;
	rightIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
	{
		label,
		error,
		helperText,
		leftIcon,
		rightIcon,
		id,
		className = "",
		disabled,
		...props
	},
	ref,
) {
	const inputId = id || props.name || undefined;

	return (
		<div className="w-full flex flex-col gap-1.5">
			{label && (
				<label
					htmlFor={inputId}
					className="text-xs font-semibold text-slate-700 tracking-wide"
				>
					{label}
				</label>
			)}
			<div className="relative flex items-center">
				{leftIcon && (
					<div className="absolute left-3 flex items-center pointer-events-none text-slate-400">
						{leftIcon}
					</div>
				)}
				<input
					ref={ref}
					id={inputId}
					disabled={disabled}
					className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed ${
						leftIcon ? "pl-9" : ""
					} ${rightIcon ? "pr-9" : ""} ${
						error
							? "border-rose-400 focus:border-rose-500 focus:ring-rose-200"
							: "border-slate-300 focus:border-teal-600 focus:ring-teal-100"
					} ${className}`}
					{...props}
				/>
				{rightIcon && (
					<div className="absolute right-3 flex items-center text-slate-400">
						{rightIcon}
					</div>
				)}
			</div>
			{error ? (
				<p className="text-xs text-rose-600 font-medium">{error}</p>
			) : helperText ? (
				<p className="text-xs text-slate-500">{helperText}</p>
			) : null}
		</div>
	);
});
