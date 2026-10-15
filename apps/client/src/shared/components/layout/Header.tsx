import { Clock, LogOut, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { RealtimeIndicator } from "../ui/RealtimeIndicator";

export interface HeaderProps {
	onOpenMobileMenu?: () => void;
}

export function Header({ onOpenMobileMenu }: HeaderProps) {
	const { user, logout } = useAuth();
	const [currentTime, setCurrentTime] = useState<string>("");

	useEffect(() => {
		const update = () => {
			const now = new Date();
			setCurrentTime(
				now.toLocaleTimeString([], {
					hour: "2-digit",
					minute: "2-digit",
					second: "2-digit",
				}),
			);
		};
		update();
		const interval = setInterval(update, 1000);
		return () => clearInterval(interval);
	}, []);

	const roleVariant =
		user?.role === "SUPER_ADMIN"
			? "purple"
			: user?.role === "DOCTOR"
				? "info"
				: "success";

	return (
		<header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 sm:px-6 backdrop-blur-xs">
			<div className="flex items-center gap-3">
				{/* Hamburger button for mobile */}
				{onOpenMobileMenu && (
					<button
						type="button"
						onClick={onOpenMobileMenu}
						className="p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg lg:hidden cursor-pointer"
						aria-label="Open clinical navigation"
					>
						<Menu className="h-5 w-5" />
					</button>
				)}

				<div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-100/80 px-2.5 py-1.5 rounded-lg border border-slate-200/60">
					<Clock className="h-3.5 w-3.5 text-teal-700" />
					<span className="tabular-nums font-mono">{currentTime}</span>
					<span className="text-slate-300">|</span>
					<span>Outpatient Clinic</span>
				</div>

				<RealtimeIndicator />
			</div>

			<div className="flex items-center gap-2 sm:gap-3">
				{user && (
					<div className="flex items-center gap-2 sm:gap-3 sm:border-r sm:border-slate-200 sm:pr-3">
						<div className="flex flex-col text-right">
							<span className="text-xs font-semibold text-slate-900 leading-tight max-w-[120px] sm:max-w-none truncate">
								{user.name}
							</span>
							<span className="hidden md:inline text-[11px] text-slate-500 font-mono">
								{user.email}
							</span>
						</div>
						<Badge
							variant={roleVariant}
							size="sm"
							dot
							className="hidden sm:inline-flex"
						>
							{user.role.replace("_", " ")}
						</Badge>
					</div>
				)}

				<Button
					variant="ghost"
					size="sm"
					onClick={() => void logout()}
					leftIcon={<LogOut className="h-4 w-4 text-slate-500" />}
					title="Sign out of EMR"
					className="px-2 sm:px-3.5"
				>
					<span className="hidden sm:inline">Sign Out</span>
				</Button>
			</div>
		</header>
	);
}
