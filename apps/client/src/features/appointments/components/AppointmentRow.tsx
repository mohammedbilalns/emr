import type { AppointmentDto, Role } from "@emr/shared";
import { CheckCircle2, Eye, FileEdit, UserCheck, XCircle } from "lucide-react";
import React from "react";
import { Button } from "../../../shared/components/ui/Button";
import { StatusBadge } from "./StatusBadge";

export interface AppointmentRowProps {
	appointment: AppointmentDto;
	userRole: Role;
	onMarkArrived: (id: string) => void;
	onComplete: (id: string) => void;
	onOpenCancel: (appointment: AppointmentDto) => void;
	onOpenEditNotes: (appointment: AppointmentDto) => void;
	onViewDetails: (appointment: AppointmentDto) => void;
	isActionPending?: boolean;
}

export const AppointmentRow = React.memo(function AppointmentRow({
	appointment,
	userRole,
	onMarkArrived,
	onComplete,
	onOpenCancel,
	onOpenEditNotes,
	onViewDetails,
	isActionPending = false,
}: AppointmentRowProps) {
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
		<tr className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
			{/* Patient */}
			<td className="px-4 py-3.5">
				<div className="flex flex-col">
					<span className="text-xs font-semibold text-slate-900">
						{appointment.patient.name}
					</span>
					<span className="text-[11px] text-slate-500 font-mono">
						{appointment.patient.patientCode} · {appointment.patient.mobile}
					</span>
				</div>
			</td>

			{/* Physician & Dept */}
			<td className="px-4 py-3.5">
				<div className="flex flex-col">
					<span className="text-xs font-medium text-slate-900">
						{appointment.doctor.name}
					</span>
					<span className="text-[11px] text-slate-500">
						{appointment.doctor.department}
					</span>
				</div>
			</td>

			{/* Slot & Timing */}
			<td className="px-4 py-3.5 whitespace-nowrap">
				<div className="flex flex-col">
					<span className="text-xs font-mono font-medium text-slate-900">
						{appointment.date}
					</span>
					<span className="text-[11px] font-mono text-slate-500">
						{appointment.startTime} – {appointment.endTime}
					</span>
				</div>
			</td>

			{/* Status */}
			<td className="px-4 py-3.5 whitespace-nowrap">
				<StatusBadge status={appointment.status} />
			</td>

			{/* Purpose Excerpt */}
			<td className="px-4 py-3.5 max-w-[200px] truncate text-xs text-slate-600">
				{appointment.purpose || (
					<span className="text-slate-400 italic">None specified</span>
				)}
			</td>

			{/* Actions */}
			<td className="px-4 py-3.5 whitespace-nowrap text-right">
				<div className="flex items-center justify-end gap-1.5">
					{/* Mark Arrived Action */}
					{canMarkArrived && (
						<Button
							variant="outline"
							size="sm"
							onClick={() => onMarkArrived(appointment.id)}
							disabled={isActionPending}
							leftIcon={<UserCheck className="h-3.5 w-3.5 text-amber-600" />}
							className="text-amber-800 border-amber-200 bg-amber-50/50 hover:bg-amber-100/50"
							title="Mark patient as arrived at clinic"
						>
							Arrive
						</Button>
					)}

					{/* Complete Action */}
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
							title="Mark consultation completed"
						>
							Complete
						</Button>
					)}

					{/* Edit Notes */}
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

					{/* Cancel Button */}
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

					{/* View Details */}
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
			</td>
		</tr>
	);
});
