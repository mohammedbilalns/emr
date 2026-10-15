import type { AppointmentDto, Role } from "@emr/shared";
import {
	Calendar,
	CheckCircle2,
	Clock,
	Eye,
	FileEdit,
	Stethoscope,
	UserCheck,
	XCircle,
} from "lucide-react";
import React from "react";
import { Button } from "../../../shared/components/ui/Button";
import { StatusBadge } from "./StatusBadge";

export interface AppointmentCardProps {
	appointment: AppointmentDto;
	userRole: Role;
	onMarkArrived: (id: string) => void;
	onComplete: (id: string) => void;
	onOpenCancel: (appointment: AppointmentDto) => void;
	onOpenEditNotes: (appointment: AppointmentDto) => void;
	onViewDetails: (appointment: AppointmentDto) => void;
	isActionPending?: boolean;
}

export const AppointmentCard = React.memo(function AppointmentCard({
	appointment,
	userRole,
	onMarkArrived,
	onComplete,
	onOpenCancel,
	onOpenEditNotes,
	onViewDetails,
	isActionPending = false,
}: AppointmentCardProps) {
	const isScheduled = appointment.status === "SCHEDULED";
	const isArrived = appointment.status === "ARRIVED";
	const isTerminal =
		appointment.status === "COMPLETED" || appointment.status === "CANCELLED";

	const canMarkArrived =
		(userRole === "RECEPTIONIST" || userRole === "SUPER_ADMIN") && isScheduled;

	const canComplete =
		(userRole === "DOCTOR" || userRole === "SUPER_ADMIN") && isArrived;

	const canCancel =
		(userRole === "RECEPTIONIST" || userRole === "SUPER_ADMIN") && !isTerminal;

	const canEditNotes = !isTerminal;

	return (
		<div className="flex flex-col gap-3 p-4 rounded-xl border border-slate-200/80 bg-white shadow-2xs hover:border-slate-300 transition-colors">
			{/* Header: Patient & Status */}
			<div className="flex items-start justify-between gap-2">
				<div className="flex flex-col">
					<span className="text-sm font-bold text-slate-900 leading-tight">
						{appointment.patient.name}
					</span>
					<span className="text-[11px] font-mono text-slate-500 mt-0.5">
						{appointment.patient.patientCode} · {appointment.patient.mobile}
					</span>
				</div>
				<StatusBadge status={appointment.status} size="sm" />
			</div>

			{/* Appointment Details Grid */}
			<div className="grid grid-cols-1 xs:grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
				<div className="flex items-center gap-1.5 min-w-0">
					<Calendar className="h-3.5 w-3.5 text-teal-700 shrink-0" />
					<span className="font-mono text-slate-800 font-medium truncate">
						{appointment.date}
					</span>
				</div>

				<div className="flex items-center gap-1.5 min-w-0">
					<Clock className="h-3.5 w-3.5 text-teal-700 shrink-0" />
					<span className="font-mono text-slate-800 font-medium truncate">
						{appointment.startTime} – {appointment.endTime}
					</span>
				</div>

				<div className="flex items-center gap-1.5 col-span-full min-w-0">
					<Stethoscope className="h-3.5 w-3.5 text-teal-700 shrink-0" />
					<span className="font-medium text-slate-800 truncate">
						{appointment.doctor.name}
					</span>
					<span className="text-[11px] text-slate-400">
						({appointment.doctor.department})
					</span>
				</div>
			</div>

			{/* Purpose excerpt if any */}
			{appointment.purpose && (
				<p className="text-xs text-slate-600 line-clamp-2 italic bg-slate-50/40 px-2 py-1 rounded">
					"{appointment.purpose}"
				</p>
			)}

			{/* Actions Footer */}
			<div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
				<div className="flex items-center gap-1.5">
					{canMarkArrived && (
						<Button
							variant="outline"
							size="sm"
							onClick={() => onMarkArrived(appointment.id)}
							disabled={isActionPending}
							leftIcon={<UserCheck className="h-3.5 w-3.5 text-amber-600" />}
							className="text-amber-800 border-amber-200 bg-amber-50/50 hover:bg-amber-100/50"
						>
							Arrive
						</Button>
					)}

					{canComplete && (
						<Button
							variant="outline"
							size="sm"
							onClick={() => onComplete(appointment.id)}
							disabled={isActionPending}
							leftIcon={
								<CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
							}
							className="text-emerald-800 border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/50"
						>
							Complete
						</Button>
					)}
				</div>

				<div className="flex items-center gap-1 ml-auto">
					{canEditNotes && (
						<button
							type="button"
							onClick={() => onOpenEditNotes(appointment)}
							className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
							title="Edit notes & purpose"
							aria-label="Edit notes and purpose"
						>
							<FileEdit className="h-4 w-4" />
						</button>
					)}

					{canCancel && (
						<button
							type="button"
							onClick={() => onOpenCancel(appointment)}
							className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
							title="Cancel appointment slot"
							aria-label="Cancel appointment"
						>
							<XCircle className="h-4 w-4" />
						</button>
					)}

					<button
						type="button"
						onClick={() => onViewDetails(appointment)}
						className="p-1.5 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-teal-50 transition-colors cursor-pointer"
						title="View full record"
						aria-label="View appointment details"
					>
						<Eye className="h-4 w-4" />
					</button>
				</div>
			</div>
		</div>
	);
});
