import { Wifi, WifiOff } from "lucide-react";
import { useSocketConnected } from "../../socket/use-realtime";

export interface RealtimeIndicatorProps {
	className?: string;
	showLabel?: boolean;
}

export function RealtimeIndicator({
	className = "",
	showLabel = true,
}: RealtimeIndicatorProps) {
	const isConnected = useSocketConnected();

	return (
		<div
			className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
				isConnected
					? "bg-emerald-50 text-emerald-700 border border-emerald-200"
					: "bg-slate-100 text-slate-500 border border-slate-200"
			} ${className}`}
			title={
				isConnected
					? "Real-time updates active via WebSocket"
					: "Reconnecting to real-time server..."
			}
			aria-live="polite"
		>
			<span className="relative flex h-2 w-2">
				{isConnected && (
					<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
				)}
				<span
					className={`relative inline-flex rounded-full h-2 w-2 ${
						isConnected ? "bg-emerald-500" : "bg-slate-400"
					}`}
				/>
			</span>
			{showLabel && (
				<span className="flex items-center gap-1">
					{isConnected ? (
						<>
							<Wifi className="h-3 w-3" />
							<span>Live</span>
						</>
					) : (
						<>
							<WifiOff className="h-3 w-3" />
							<span>Connecting</span>
						</>
					)}
				</span>
			)}
		</div>
	);
}
