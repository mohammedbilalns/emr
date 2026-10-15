import type { AppointmentDto, PaginationMeta, Role } from "@emr/shared";
import { ClipboardX } from "lucide-react";
import { getErrorMessage } from "../../../shared/api/api-errors";
import { EmptyState } from "../../../shared/components/ui/EmptyState";
import { Pagination } from "../../../shared/components/ui/Pagination";
import { Spinner } from "../../../shared/components/ui/Spinner";
import { AppointmentCard } from "./AppointmentCard";
import { AppointmentRow } from "./AppointmentRow";

export interface AppointmentTableProps {
	appointments: AppointmentDto[];
	meta?: PaginationMeta;
	isLoading: boolean;
	userRole: Role;
	onPageChange: (page: number) => void;
	onMarkArrived: (id: string) => void;
	onComplete: (id: string) => void;
	onOpenCancel: (appointment: AppointmentDto) => void;
	onOpenEditNotes: (appointment: AppointmentDto) => void;
	onViewDetails: (appointment: AppointmentDto) => void;
	isActionPending?: boolean;
	error?: unknown;
}

export function AppointmentTable({
	appointments,
	meta,
	isLoading,
	userRole,
	onPageChange,
	onMarkArrived,
	onComplete,
	onOpenCancel,
	onOpenEditNotes,
	onViewDetails,
	isActionPending,
	error,
}: AppointmentTableProps) {
	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center p-16 gap-3 min-h-[300px] bg-white rounded-xl border border-slate-200/80">
				<Spinner size="lg" className="text-teal-700" />
				<span className="text-xs font-medium text-slate-500">
					Loading appointments...
				</span>
			</div>
		);
	}

	if (error) {
		return (
			<div className="bg-white rounded-xl border border-rose-200">
				<EmptyState
					icon={<ClipboardX className="h-6 w-6 text-rose-500" />}
					title="Failed to Load Appointments"
					description={getErrorMessage(
						error,
						"Could not retrieve appointment records. Please check your connection or retry.",
					)}
				/>
			</div>
		);
	}

	if (appointments.length === 0) {
		return (
			<div className="bg-white rounded-xl border border-slate-200/80">
				<EmptyState
					icon={<ClipboardX className="h-6 w-6 text-slate-400" />}
					title="No Appointments Found"
					description="No appointment bookings match the active filter criteria. Try adjusting the search filters or date range."
				/>
			</div>
		);
	}

	return (
		<div className="flex flex-col rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
			{/* Mobile Card View (< md) */}
			<div className="md:hidden flex flex-col divide-y divide-slate-100 p-3 gap-3">
				{appointments.map((appointment) => (
					<AppointmentCard
						key={appointment.id}
						appointment={appointment}
						userRole={userRole}
						onMarkArrived={onMarkArrived}
						onComplete={onComplete}
						onOpenCancel={onOpenCancel}
						onOpenEditNotes={onOpenEditNotes}
						onViewDetails={onViewDetails}
						isActionPending={isActionPending}
					/>
				))}
			</div>

			{/* Desktop / Tablet Dense Table (>= md) */}
			<div className="hidden md:block overflow-x-auto">
				<table className="w-full min-w-[720px] text-left border-collapse">
					<thead>
						<tr className="border-b border-slate-200/80 bg-slate-50/75 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
							<th className="px-4 py-3">Patient</th>
							<th className="px-4 py-3">Physician / Dept</th>
							<th className="px-4 py-3">Scheduled Slot</th>
							<th className="px-4 py-3">Status</th>
							<th className="px-4 py-3">Chief Complaint</th>
							<th className="px-4 py-3 text-right">Actions</th>
						</tr>
					</thead>
					<tbody>
						{appointments.map((appointment) => (
							<AppointmentRow
								key={appointment.id}
								appointment={appointment}
								userRole={userRole}
								onMarkArrived={onMarkArrived}
								onComplete={onComplete}
								onOpenCancel={onOpenCancel}
								onOpenEditNotes={onOpenEditNotes}
								onViewDetails={onViewDetails}
								isActionPending={isActionPending}
							/>
						))}
					</tbody>
				</table>
			</div>

			{/* Server-side Pagination Bar */}
			{meta && (
				<Pagination
					page={meta.page}
					totalPages={meta.totalPages}
					total={meta.total}
					limit={meta.limit}
					onPageChange={onPageChange}
				/>
			)}
		</div>
	);
}
