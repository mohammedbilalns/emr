import type { HTMLAttributes } from "react";

export function Card({
	children,
	className = "",
	...props
}: HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={`rounded-xl border border-slate-200/80 bg-white shadow-xs transition-shadow ${className}`}
			{...props}
		>
			{children}
		</div>
	);
}

export function CardHeader({
	children,
	className = "",
	...props
}: HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={`flex flex-col gap-1 border-b border-slate-100 p-5 ${className}`}
			{...props}
		>
			{children}
		</div>
	);
}

export function CardTitle({
	children,
	className = "",
	...props
}: HTMLAttributes<HTMLHeadingElement>) {
	return (
		<h3
			className={`text-base font-semibold text-slate-900 tracking-tight ${className}`}
			{...props}
		>
			{children}
		</h3>
	);
}

export function CardDescription({
	children,
	className = "",
	...props
}: HTMLAttributes<HTMLParagraphElement>) {
	return (
		<p className={`text-xs text-slate-500 ${className}`} {...props}>
			{children}
		</p>
	);
}

export function CardContent({
	children,
	className = "",
	...props
}: HTMLAttributes<HTMLDivElement>) {
	return (
		<div className={`p-5 ${className}`} {...props}>
			{children}
		</div>
	);
}

export function CardFooter({
	children,
	className = "",
	...props
}: HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={`flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/50 px-5 py-3.5 rounded-b-xl ${className}`}
			{...props}
		>
			{children}
		</div>
	);
}
