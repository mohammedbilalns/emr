import { forwardRef, type ReactNode, type SelectHTMLAttributes } from "react";

export interface SelectOption {
	label: string;
	value: string | number;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
	label?: string;
	error?: string;
	helperText?: string;
	options?: SelectOption[];
	children?: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
	function Select(
		{
			label,
			error,
			helperText,
			options,
			children,
			id,
			className = "",
			disabled,
			...props
		},
		ref,
	) {
		const selectId = id || props.name || undefined;

		return (
			<div className="w-full flex flex-col gap-1.5">
				{label && (
					<label
						htmlFor={selectId}
						className="text-xs font-semibold text-slate-700 tracking-wide"
					>
						{label}
					</label>
				)}
				<select
					ref={ref}
					id={selectId}
					disabled={disabled}
					className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 transition-colors focus:outline-none focus:ring-2 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed ${
						error
							? "border-rose-400 focus:border-rose-500 focus:ring-rose-200"
							: "border-slate-300 focus:border-teal-600 focus:ring-teal-100"
					} ${className}`}
					{...props}
				>
					{options
						? options.map((opt) => (
								<option key={opt.value} value={opt.value}>
									{opt.label}
								</option>
							))
						: children}
				</select>
				{error ? (
					<p className="text-xs text-rose-600 font-medium">{error}</p>
				) : helperText ? (
					<p className="text-xs text-slate-500">{helperText}</p>
				) : null}
			</div>
		);
	},
);
