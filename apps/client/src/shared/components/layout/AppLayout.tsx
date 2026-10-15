import { useState } from "react";
import { Outlet } from "react-router-dom";
import { useRealtimeGlobal } from "../../socket/use-realtime";
import { ToastContainer } from "../ui/Toast";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

export function AppLayout() {
	const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
	useRealtimeGlobal();

	return (
		<div className="min-h-screen flex bg-slate-50 text-slate-900 font-sans antialiased">
			<Sidebar
				isMobileOpen={isMobileNavOpen}
				onCloseMobile={() => setIsMobileNavOpen(false)}
			/>
			<div className="flex-1 flex flex-col min-w-0">
				<Header onOpenMobileMenu={() => setIsMobileNavOpen(true)} />
				<main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
					<Outlet />
				</main>
			</div>
			<ToastContainer />
		</div>
	);
}
