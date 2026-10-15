import { useQuery } from "@tanstack/react-query";
import {
	Activity,
	CalendarCheck,
	CalendarClock,
	CheckCircle2,
	Clock,
	Plus,
	Stethoscope,
	UserCheck,
	Users,
} from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../../shared/components/ui/Button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../../../shared/components/ui/Card";
import { RealtimeIndicator } from "../../../shared/components/ui/RealtimeIndicator";
import { useAuth } from "../../../shared/context/AuthContext";
import { listAppointmentsApi } from "../../appointments/api/appointments.api";
import { useAppointmentActions } from "../../appointments/hooks/use-appointment-actions";
import { MetricStatCard } from "../components/MetricStatCard";
import { TodayQueueTable } from "../components/TodayQueueTable";

export function DashboardPage() {
	const { user, isReceptionist, isSuperAdmin } = useAuth();

	// Today's date string YYYY-MM-DD
	const todayString = useMemo(() => {
		const now = new Date();
		return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
	}, []);

	// Query today's appointments
	const {
		data,
		isLoading,
		error: appointmentsError,
	} = useQuery({
		queryKey: ["appointments", { dateFrom: todayString, dateTo: todayString }],
		queryFn: () =>
			listAppointmentsApi({
				dateFrom: todayString,
				dateTo: todayString,
				limit: 100,
			}),
		staleTime: 15_000,
		refetchInterval: 30_000,
	});

	const { markArrived, isMarkingArrived, completeAppointment, isCompleting } =
		useAppointmentActions();

	const appointments = data?.items || [];

	const metrics = useMemo(() => {
		let scheduled = 0;
		let arrived = 0;
		let completed = 0;
		let cancelled = 0;

		for (const appt of appointments) {
			if (appt.status === "SCHEDULED") scheduled++;
			else if (appt.status === "ARRIVED") arrived++;
			else if (appt.status === "COMPLETED") completed++;
			else if (appt.status === "CANCELLED") cancelled++;
		}

		return {
			total: appointments.length,
			scheduled,
			arrived,
			completed,
			cancelled,
		};
	}, [appointments]);

	if (!user) return null;

	return (
		<div className="flex flex-col gap-6">
			{/* Page Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
						<Activity className="h-6 w-6 text-teal-700" />
						<span>Clinical Operations Overview</span>
					</h1>
					<p className="text-xs text-slate-500 mt-0.5">
						Welcome back, {user.name}. Overview for today ({todayString}).
					</p>
				</div>

				<div className="flex items-center gap-2">
					<RealtimeIndicator />
					{(isReceptionist || isSuperAdmin) && (
						<Link to="/scheduler">
							<Button
								variant="primary"
								size="sm"
								leftIcon={<Plus className="h-4 w-4" />}
							>
								Book Appointment
							</Button>
						</Link>
					)}
				</div>
			</div>

			{/* KPI Summary Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				<MetricStatCard
					title="Today's Appointments"
					value={metrics.total}
					description="Total booked for today"
					icon={<CalendarClock className="h-5 w-5 text-teal-700" />}
					iconBg="bg-teal-50"
				/>

				<MetricStatCard
					title="Waiting in Clinic"
					value={metrics.arrived}
					description="Arrived & ready for doctor"
					icon={<UserCheck className="h-5 w-5 text-amber-700" />}
					iconBg="bg-amber-50"
				/>

				<MetricStatCard
					title="Scheduled & Pending"
					value={metrics.scheduled}
					description="Awaiting patient arrival"
					icon={<Clock className="h-5 w-5 text-sky-700" />}
					iconBg="bg-sky-50"
				/>

				<MetricStatCard
					title="Consultations Done"
					value={metrics.completed}
					description="Completed appointments"
					icon={<CheckCircle2 className="h-5 w-5 text-emerald-700" />}
					iconBg="bg-emerald-50"
				/>
			</div>

			{/* Operational Queue and Quick Shortcuts */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Today's Queue (2 Columns) */}
				<Card className="lg:col-span-2">
					<CardHeader className="flex flex-row items-center justify-between pb-3">
						<div>
							<CardTitle className="text-sm font-semibold">
								Today's Patient Queue
							</CardTitle>
							<CardDescription>
								Live stream of patients scheduled for consultation today
							</CardDescription>
						</div>
						<Link
							to="/appointments"
							className="text-xs font-semibold text-teal-700 hover:text-teal-800"
						>
							View All Appointments →
						</Link>
					</CardHeader>
					<CardContent className="p-0">
						<TodayQueueTable
							appointments={appointments}
							userRole={user.role}
							onMarkArrived={markArrived}
							onComplete={completeAppointment}
							isLoading={isMarkingArrived || isCompleting || isLoading}
							error={appointmentsError}
						/>
					</CardContent>
				</Card>

				{/* Quick Actions & Department Navigation (1 Column) */}
				<div className="flex flex-col gap-4">
					<Card data-testid="quick-shortcuts">
						<CardHeader className="pb-3">
							<CardTitle className="text-sm font-semibold">
								Quick Shortcuts
							</CardTitle>
						</CardHeader>
						<CardContent className="flex flex-col gap-2.5">
							{(isReceptionist || isSuperAdmin) && (
								<Link
									to="/scheduler"
									className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-teal-300 hover:bg-teal-50/50 transition-colors"
								>
									<div className="p-2 rounded-md bg-teal-50 text-teal-700">
										<CalendarClock className="h-4 w-4" />
									</div>
									<div className="flex flex-col">
										<span className="text-xs font-semibold text-slate-900">
											Schedule Appointment
										</span>
										<span className="text-[11px] text-slate-500">
											Check doctor availability and book
										</span>
									</div>
								</Link>
							)}

							<Link
								to="/appointments"
								className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-teal-300 hover:bg-teal-50/50 transition-colors"
							>
								<div className="p-2 rounded-md bg-indigo-50 text-indigo-700">
									<CalendarCheck className="h-4 w-4" />
								</div>
								<div className="flex flex-col">
									<span className="text-xs font-semibold text-slate-900">
										Patient Appointments
									</span>
									<span className="text-[11px] text-slate-500">
										View appointments, arrivals, and visit notes
									</span>
								</div>
							</Link>

							{isSuperAdmin && (
								<>
									<Link
										to="/doctors"
										className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-teal-300 hover:bg-teal-50/50 transition-colors"
									>
										<div className="p-2 rounded-md bg-sky-50 text-sky-700">
											<Stethoscope className="h-4 w-4" />
										</div>
										<div className="flex flex-col">
											<span className="text-xs font-semibold text-slate-900">
												Doctor Schedules
											</span>
											<span className="text-[11px] text-slate-500">
												Set consultation hours, sessions, and breaks
											</span>
										</div>
									</Link>

									<Link
										to="/staff"
										className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-teal-300 hover:bg-teal-50/50 transition-colors"
									>
										<div className="p-2 rounded-md bg-purple-50 text-purple-700">
											<Users className="h-4 w-4" />
										</div>
										<div className="flex flex-col">
											<span className="text-xs font-semibold text-slate-900">
												Receptionist Staff
											</span>
											<span className="text-[11px] text-slate-500">
												Register & manage front-desk staff
											</span>
										</div>
									</Link>
								</>
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
