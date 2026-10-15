import {
	Activity,
	CalendarClock,
	ClipboardList,
	LayoutDashboard,
	Stethoscope,
	Users,
	X,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

interface NavItem {
	label: string;
	to: string;
	icon: React.ComponentType<{ className?: string }>;
	roles?: Array<"SUPER_ADMIN" | "RECEPTIONIST" | "DOCTOR">;
}

const NAV_ITEMS: NavItem[] = [
	{
		label: "Dashboard",
		to: "/dashboard",
		icon: LayoutDashboard,
	},
	{
		label: "Scheduler & Booking",
		to: "/scheduler",
		icon: CalendarClock,
		roles: ["SUPER_ADMIN", "RECEPTIONIST"],
	},
	{
		label: "Appointments",
		to: "/appointments",
		icon: ClipboardList,
	},
	{
		label: "Doctor Schedules",
		to: "/doctors",
		icon: Stethoscope,
		roles: ["SUPER_ADMIN"],
	},
	{
		label: "Staff Directory",
		to: "/staff",
		icon: Users,
		roles: ["SUPER_ADMIN"],
	},
];

export interface SidebarProps {
	isMobileOpen?: boolean;
	onCloseMobile?: () => void;
}

export function Sidebar({ isMobileOpen = false, onCloseMobile }: SidebarProps) {
	const { user } = useAuth();

	const visibleItems = NAV_ITEMS.filter((item) => {
		if (!item.roles) return true;
		if (!user) return false;
		return item.roles.includes(user.role);
	});

	const sidebarContent = (
		<div className="flex flex-col h-full">
			{/* Brand Header */}
			<div className="flex items-center justify-between px-6 h-16 border-b border-slate-800 shrink-0">
				<div className="flex items-center gap-3">
					<div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20">
						<Activity className="h-5 w-5" />
					</div>
					<div className="flex flex-col">
						<span className="text-sm font-bold tracking-tight text-white leading-tight">
							Medical Center
						</span>
						<span className="text-[10px] uppercase font-mono tracking-wider text-teal-400 font-semibold">
							Outpatient Services
						</span>
					</div>
				</div>

				{/* Close Button for Mobile Drawer */}
				{onCloseMobile && (
					<button
						type="button"
						onClick={onCloseMobile}
						className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden cursor-pointer"
						aria-label="Close navigation"
					>
						<X className="h-5 w-5" />
					</button>
				)}
			</div>

			{/* Navigation Links */}
			<nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
				<div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
					Clinical Services
				</div>
				{visibleItems.map((item) => {
					const Icon = item.icon;
					return (
						<NavLink
							key={item.to}
							to={item.to}
							onClick={onCloseMobile}
							className={({ isActive }) =>
								`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 ${
									isActive
										? "bg-teal-600 text-white shadow-xs font-semibold"
										: "text-slate-400 hover:text-slate-100 hover:bg-slate-800/80"
								}`
							}
						>
							<Icon className="h-4 w-4 shrink-0" />
							<span>{item.label}</span>
						</NavLink>
					);
				})}
			</nav>

			{/* Footer Info */}
			<div className="p-4 border-t border-slate-800 text-[11px] text-slate-500 flex flex-col gap-1 shrink-0">
				<div className="flex items-center justify-between text-[10px]">
					<span className="font-medium text-slate-400">Care Center Portal</span>
					<span className="flex h-2 w-2 rounded-full bg-emerald-500" />
				</div>
				<span className="text-[10px] text-slate-500">
					Confidential Patient Care
				</span>
			</div>
		</div>
	);

	return (
		<>
			{/* Desktop Persistent Sidebar */}
			<aside className="hidden lg:flex w-64 border-r border-slate-200/80 bg-slate-900 text-slate-300 flex-col shrink-0 min-h-screen sticky top-0 h-screen">
				{sidebarContent}
			</aside>

			{/* Mobile Slide-Over Drawer */}
			{isMobileOpen && (
				<div className="fixed inset-0 z-50 lg:hidden flex">
					{/* Backdrop */}
					<button
						type="button"
						onClick={onCloseMobile}
						className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity cursor-default w-full h-full border-none p-0"
						aria-label="Close navigation overlay"
					/>

					{/* Drawer Panel */}
					<div className="relative z-50 w-72 max-w-[85vw] bg-slate-900 text-slate-300 h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-200">
						{sidebarContent}
					</div>
				</div>
			)}
		</>
	);
}
