interface SpinnerProps {
	size?: "xs" | "sm" | "md" | "lg";
	className?: string;
}

export function Spinner({ size = "md", className = "" }: SpinnerProps) {
	const sizeMap = {
		xs: "h-3.5 w-3.5 border-2",
		sm: "h-4 w-4 border-2",
		md: "h-5 w-5 border-2",
		lg: "h-7 w-7 border-3",
	};

	return (
		<span
			className={`inline-block animate-spin rounded-full border-current border-t-transparent text-current ${sizeMap[size]} ${className}`}
			role="status"
			aria-label="Loading"
		/>
	);
}
