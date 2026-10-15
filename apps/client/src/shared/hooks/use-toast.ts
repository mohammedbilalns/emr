import { useCallback, useState } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastMessage {
	id: string;
	title?: string;
	message: string;
	type: ToastType;
	durationMs?: number;
}

let toastListeners: Array<(toasts: ToastMessage[]) => void> = [];
let memoryToasts: ToastMessage[] = [];

function notifyListeners(): void {
	for (const listener of toastListeners) {
		listener([...memoryToasts]);
	}
}

export function showToast(
	message: string,
	type: ToastType = "info",
	options?: { title?: string; durationMs?: number },
): void {
	const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
	const newToast: ToastMessage = {
		id,
		message,
		type,
		title: options?.title,
		durationMs: options?.durationMs ?? 4000,
	};

	memoryToasts = [...memoryToasts, newToast];
	notifyListeners();

	setTimeout(() => {
		dismissToast(id);
	}, newToast.durationMs);
}

export function dismissToast(id: string): void {
	memoryToasts = memoryToasts.filter((t) => t.id !== id);
	notifyListeners();
}

export function useToast() {
	const [toasts, setToasts] = useState<ToastMessage[]>(memoryToasts);

	const subscribe = useCallback(() => {
		const listener = (newToasts: ToastMessage[]) => {
			setToasts(newToasts);
		};
		toastListeners.push(listener);
		return () => {
			toastListeners = toastListeners.filter((l) => l !== listener);
		};
	}, []);

	return {
		toasts,
		subscribe,
		dismiss: dismissToast,
		success: (msg: string, title?: string) =>
			showToast(msg, "success", { title }),
		error: (msg: string, title?: string) => showToast(msg, "error", { title }),
		info: (msg: string, title?: string) => showToast(msg, "info", { title }),
		warning: (msg: string, title?: string) =>
			showToast(msg, "warning", { title }),
	};
}
