import type { AppointmentDto, Role } from "@emr/shared";
import { CheckCircle2, Clock, UserCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { getErrorMessage } from "../../../shared/api/api-errors";
import { Button } from "../../../shared/components/ui/Button";
import { EmptyState } from "../../../shared/components/ui/EmptyState";
import { StatusBadge } from "../../appointments/components/StatusBadge";

export interface TodayQueueTableProps {
	appointments: AppointmentDto[];
	userRole: Role;
	onMarkArrived: (id: string) => void;
	onComplete: (id: string) => void;
	isLoading?: boolean;
	error?: unknown;
}

export function TodayQueueTable({
	appointments,
	userRole,
	onMarkArrived,
	onComplete,
	isLoading = false,
	error,
}: TodayQueueTableProps) {
	if (error) {
		return (
			<EmptyState
				icon={<Clock className="h-6 w-6 text-rose-500" />}
				title="Failed to Load Today's Queue"
				description={getErrorMessage(
					error,
					"Could not retrieve today's appointments. Please retry.",
				)}
			/>
		);
	}

	if (appointments.length === 0) {
		return (
			<EmptyState
				icon={<Clock className="h-6 w-6 text-slate-400" />}
				title="No Appointments Scheduled for Today"
				description="There are currently no patients booked in today's clinical queue."
				action={
					userRole !== "DOCTOR" ? (
						<Link to="/scheduler">
							<Button variant="outline" size="sm">
								Open Scheduler & Book
							</Button>
						</Link>
					) : undefined
				}
			/>
		);
	}

	return (
		<>
			{/* Mobile Queue Cards (< sm) */}
			<div className="sm:hidden flex flex-col divide-y divide-slate-100 p-3 gap-3">
				{appointments.slice(0, 8).map((appointment) => {
					const isScheduled = appointment.status === "SCHEDULED";
					const isArrived = appointment.status === "ARRIVED";

					const canArrive =
						(userRole === "RECEPTIONIST" || userRole === "SUPER_ADMIN") &&
						isScheduled;
					const canComplete =
						(userRole === "DOCTOR" || userRole === "SUPER_ADMIN") && isArrived;

					return (
						<div
							key={appointment.id}
							className="flex flex-col gap-2.5 p-3 rounded-xl border border-slate-200/80 bg-white shadow-2xs"
						>
							<div className="flex items-center justify-between">
								<span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
									{appointment.startTime}
								</span>
								<StatusBadge status={appointment.status} size="sm" />
							</div>

							<div className="flex items-start justify-between gap-2">
								<div className="flex flex-col">
									<span className="text-xs font-semibold text-slate-900">
										{appointment.patient.name}
									</span>
									<span className="text-[11px] text-slate-500 font-mono">
										{appointment.patient.patientCode} ·{" "}
										{appointment.patient.mobile}
									</span>
								</div>

								<div className="text-right">
									<span className="text-xs text-slate-800 font-medium block">
										{appointment.doctor.name}
									</span>
									<span className="text-[10px] text-slate-400 block">
										{appointment.doctor.department}
									</span>
								</div>
							</div>

							{(canArrive || canComplete) && (
								<div className="pt-2 border-t border-slate-100 flex justify-end">
									{canArrive && (
										<Button
											variant="outline"
											size="sm"
											onClick={() => onMarkArrived(appointment.id)}
											disabled={isLoading}
											leftIcon={
												<UserCheck className="h-3.5 w-3.5 text-amber-600" />
											}
											className="w-full text-amber-800 border-amber-200 bg-amber-50 hover:bg-amber-100 justify-center"
										>
											Mark Arrived
										</Button>
									)}
									{canComplete && (
										<Button
											variant="outline"
											size="sm"
											onClick={() => onComplete(appointment.id)}
											disabled={isLoading}
											leftIcon={
												<CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
											}
											className="w-full text-emerald-800 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 justify-center"
										>
											Complete Consultation
										</Button>
									)}
								</div>
							)}
						</div>
					);
				})}
			</div>

			{/* Desktop / Tablet Queue Table (>= sm) */}
			<div className="hidden sm:block overflow-x-auto">
				<table className="w-full min-w-[540px] text-left border-collapse">
					<thead>
						<tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
							<th className="px-4 py-3">Time</th>
							<th className="px-4 py-3">Patient</th>
							<th className="px-4 py-3">Physician</th>
							<th className="px-4 py-3">Status</th>
							<th className="px-4 py-3 text-right">Quick Action</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-slate-100">
						{appointments.slice(0, 8).map((appointment) => {
							const isScheduled = appointment.status === "SCHEDULED";
							const isArrived = appointment.status === "ARRIVED";

							const canArrive =
								(userRole === "RECEPTIONIST" || userRole === "SUPER_ADMIN") &&
								isScheduled;
							const canComplete =
								(userRole === "DOCTOR" || userRole === "SUPER_ADMIN") &&
								isArrived;

							return (
								<tr
									key={appointment.id}
									className="hover:bg-slate-50/50 transition-colors"
								>
									<td className="px-4 py-3 whitespace-nowrap font-mono text-xs font-semibold text-slate-900">
										{appointment.startTime}
									</td>
									<td className="px-4 py-3">
										<div className="flex flex-col">
											<span className="text-xs font-semibold text-slate-900">
												{appointment.patient.name}
											</span>
											<span className="text-[11px] text-slate-500 font-mono">
												{appointment.patient.patientCode} ·{" "}
												{appointment.patient.mobile}
											</span>
										</div>
									</td>
									<td className="px-4 py-3">
										<div className="flex flex-col">
											<span className="text-xs text-slate-800 font-medium">
												{appointment.doctor.name}
											</span>
											<span className="text-[11px] text-slate-500">
												{appointment.doctor.department}
											</span>
										</div>
									</td>
									<td className="px-4 py-3 whitespace-nowrap">
										<StatusBadge status={appointment.status} />
									</td>
									<td className="px-4 py-3 whitespace-nowrap text-right">
										{canArrive && (
											<Button
												variant="outline"
												size="sm"
												onClick={() => onMarkArrived(appointment.id)}
												disabled={isLoading}
												leftIcon={
													<UserCheck className="h-3.5 w-3.5 text-amber-600" />
												}
												className="text-amber-800 border-amber-200 bg-amber-50 hover:bg-amber-100"
											>
												Mark Arrived
											</Button>
										)}
										{canComplete && (
											<Button
												variant="outline"
												size="sm"
												onClick={() => onComplete(appointment.id)}
												disabled={isLoading}
												leftIcon={
													<CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
												}
												className="text-emerald-800 border-emerald-200 bg-emerald-50 hover:bg-emerald-100"
											>
												Complete
											</Button>
										)}
										{!canArrive && !canComplete && (
											<span className="text-xs text-slate-400 italic">
												None
											</span>
										)}
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
		</>
	);
}
