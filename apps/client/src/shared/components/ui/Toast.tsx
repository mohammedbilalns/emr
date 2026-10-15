import {
	AlertCircle,
	AlertTriangle,
	CheckCircle2,
	Info,
	X,
} from "lucide-react";
import { useEffect } from "react";
import { type ToastType, useToast } from "../../hooks/use-toast";

function getToastIcon(type: ToastType) {
	switch (type) {
		case "success":
			return <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />;
		case "error":
			return <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />;
		case "warning":
			return <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />;
		case "info":
			return <Info className="h-5 w-5 text-teal-600 shrink-0" />;
	}
}

function getToastBorder(type: ToastType) {
	switch (type) {
		case "success":
			return "border-emerald-200 bg-white";
		case "error":
			return "border-rose-200 bg-white";
		case "warning":
			return "border-amber-200 bg-white";
		case "info":
			return "border-teal-200 bg-white";
	}
}

export function ToastContainer() {
	const { toasts, subscribe, dismiss } = useToast();

	useEffect(() => {
		const unsubscribe = subscribe();
		return unsubscribe;
	}, [subscribe]);

	if (toasts.length === 0) return null;

	return (
		<div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
			{toasts.map((toast) => (
				<div
					key={toast.id}
					className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg transition-all transform animate-in slide-in-from-bottom-2 duration-200 ${getToastBorder(toast.type)}`}
					role="alert"
				>
					{getToastIcon(toast.type)}
					<div className="flex-1 min-w-0">
						{toast.title && (
							<h4 className="text-sm font-semibold text-slate-900 leading-tight">
								{toast.title}
							</h4>
						)}
						<p className="text-xs text-slate-600 mt-0.5 leading-relaxed break-words">
							{toast.message}
						</p>
					</div>
					<button
						type="button"
						onClick={() => dismiss(toast.id)}
						className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
						aria-label="Dismiss notification"
					>
						<X className="h-4 w-4" />
					</button>
				</div>
			))}
		</div>
	);
}
