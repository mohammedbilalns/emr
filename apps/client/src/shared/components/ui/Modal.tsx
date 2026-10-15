import { X } from "lucide-react";
import { type ReactNode, useEffect } from "react";

export interface ModalProps {
	isOpen: boolean;
	onClose: () => void;
	title: string;
	description?: string;
	children: ReactNode;
	footer?: ReactNode;
	maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
}

export function Modal({
	isOpen,
	onClose,
	title,
	description,
	children,
	footer,
	maxWidth = "md",
}: ModalProps) {
	useEffect(() => {
		if (!isOpen) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				onClose();
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		document.body.style.overflow = "hidden";

		return () => {
			document.removeEventListener("keydown", handleKeyDown);
			document.body.style.overflow = "unset";
		};
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	const widthMap = {
		sm: "max-w-sm",
		md: "max-w-md",
		lg: "max-w-lg",
		xl: "max-w-xl",
		"2xl": "max-w-2xl",
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
			{/* Backdrop */}
			<button
				type="button"
				className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity cursor-default w-full h-full border-none p-0"
				onClick={onClose}
				aria-label="Close backdrop"
			/>

			{/* Dialog Card */}
			<div
				className={`relative w-full ${widthMap[maxWidth]} rounded-2xl bg-white shadow-2xl border border-slate-200/80 flex flex-col max-h-[92vh] sm:max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150 z-10`}
				role="dialog"
				aria-modal="true"
				aria-labelledby="modal-title"
			>
				{/* Header */}
				<div className="flex items-start justify-between border-b border-slate-100 p-4 sm:p-5 bg-white">
					<div>
						<h3
							id="modal-title"
							className="text-base font-semibold text-slate-900 tracking-tight"
						>
							{title}
						</h3>
						{description && (
							<p className="text-xs text-slate-500 mt-0.5">{description}</p>
						)}
					</div>
					<button
						type="button"
						onClick={onClose}
						className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100 transition-colors cursor-pointer"
						aria-label="Close dialog"
					>
						<X className="h-4 w-4" />
					</button>
				</div>

				{/* Body */}
				<div className="p-4 sm:p-5 overflow-y-auto flex-1">{children}</div>

				{/* Footer */}
				{footer && (
					<div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3 border-t border-slate-100 bg-slate-50/50 px-4 sm:px-5 py-3 sm:py-3.5">
						{footer}
					</div>
				)}
			</div>
		</div>
	);
}
