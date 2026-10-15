import { Activity, HeartHandshake, Stethoscope } from "lucide-react";
import { Navigate } from "react-router-dom";
import { Spinner } from "../../../shared/components/ui/Spinner";
import { useAuth } from "../../../shared/context/AuthContext";
import { LoginForm } from "../components/LoginForm";

export function LoginPage() {
	const { isAuthenticated, isLoading } = useAuth();

	if (isLoading) {
		return (
			<div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 gap-3">
				<Spinner size="lg" className="text-teal-400" />
			</div>
		);
	}

	if (isAuthenticated) {
		return <Navigate to="/dashboard" replace />;
	}

	return (
		<div className="min-h-screen flex bg-slate-900 text-slate-100 antialiased">
			{/* Left Branding Hero Panel */}
			<div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-linear-to-br from-slate-950 via-slate-900 to-teal-950/40 border-r border-slate-800">
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500 text-slate-950 font-bold shadow-lg shadow-teal-500/20">
						<Activity className="h-6 w-6" />
					</div>
					<div className="flex flex-col">
						<span className="text-base font-bold tracking-tight text-white">
							Medical Center EMR
						</span>
						<span className="text-[11px] font-mono uppercase text-teal-400 font-semibold tracking-wider">
							Clinical Services
						</span>
					</div>
				</div>

				<div className="max-w-md space-y-6">
					<div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-medium">
						<HeartHandshake className="h-3.5 w-3.5" />
						<span>Outpatient Care & Consultation Management</span>
					</div>
					<h1 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
						Coordinated Care & Streamlined Patient Scheduling.
					</h1>
					<p className="text-sm text-slate-400 leading-relaxed">
						Manage doctor schedules, facilitate smooth patient intake, track
						clinic arrivals, and maintain clear records for every consultation.
					</p>

					<div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
						<div className="flex flex-col">
							<span className="text-lg font-bold text-white">
								Multi-Specialty
							</span>
							<span className="text-xs text-slate-500">
								Department Schedules
							</span>
						</div>
						<div className="flex flex-col">
							<span className="text-lg font-bold text-white">Real-Time</span>
							<span className="text-xs text-slate-500">
								Patient Arrival Tracking
							</span>
						</div>
					</div>
				</div>

				<div className="text-xs text-slate-500">
					Outpatient Consultation Management System
				</div>
			</div>

			{/* Right Login Panel */}
			<div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 bg-white text-slate-900">
				<div className="w-full max-w-sm flex flex-col">
					<div className="flex items-center gap-2.5 mb-8 lg:hidden">
						<div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-700 text-white font-bold">
							<Stethoscope className="h-5 w-5" />
						</div>
						<span className="text-lg font-bold text-slate-900">
							Medical Center EMR
						</span>
					</div>

					<div className="mb-6">
						<h2 className="text-xl font-bold tracking-tight text-slate-900">
							Staff Sign In
						</h2>
						<p className="text-xs text-slate-500 mt-1">
							Enter your credentials to access your clinical workspace.
						</p>
					</div>

					<LoginForm />
				</div>
			</div>
		</div>
	);
}
