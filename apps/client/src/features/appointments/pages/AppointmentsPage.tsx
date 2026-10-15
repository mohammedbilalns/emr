import type {
	AppointmentDto,
	AppointmentListQuery,
	DoctorDto,
} from "@emr/shared";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Plus, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../../shared/components/ui/Button";
import { RealtimeIndicator } from "../../../shared/components/ui/RealtimeIndicator";
import { useAuth } from "../../../shared/context/AuthContext";
import { listDoctorsApi } from "../../scheduler/api/scheduler.api";
import { AppointmentDetailsModal } from "../components/AppointmentDetailsModal";
import { AppointmentFilters } from "../components/AppointmentFilters";
import { AppointmentTable } from "../components/AppointmentTable";
import { CancelDialog } from "../components/CancelDialog";
import { EditNotesModal } from "../components/EditNotesModal";
import { useAppointmentActions } from "../hooks/use-appointment-actions";
import { useAppointmentsQuery } from "../hooks/use-appointments-query";

export function AppointmentsPage() {
	const { user, isDoctor, isReceptionist, isSuperAdmin } = useAuth();

	const [filters, setFilters] = useState<Partial<AppointmentListQuery>>({
		page: 1,
		limit: 10,
		sortBy: "date",
		sortOrder: "desc",
	});

	// Modals state
	const [cancelTarget, setCancelTarget] = useState<AppointmentDto | null>(null);
	const [editNotesTarget, setEditNotesTarget] = useState<AppointmentDto | null>(
		null,
	);
	const [detailsTarget, setDetailsTarget] = useState<AppointmentDto | null>(
		null,
	);

	// Fetch doctors for filter selector
	const { data: doctors = [] } = useQuery<DoctorDto[]>({
		queryKey: ["doctors"],
		queryFn: listDoctorsApi,
		staleTime: 60_000,
	});

	// Query appointments
	const {
		data,
		isLoading,
		isFetching,
		error: appointmentsError,
		refetch,
	} = useAppointmentsQuery(filters);

	const {
		markArrived,
		isMarkingArrived,
		completeAppointment,
		isCompleting,
		cancelAppointment,
		isCancelling,
		updateAppointment,
		isUpdating,
		updateError,
		resetUpdate,
	} = useAppointmentActions();

	const isActionPending =
		isMarkingArrived || isCompleting || isCancelling || isUpdating;

	const handlePageChange = (newPage: number) => {
		setFilters((prev) => ({ ...prev, page: newPage }));
	};

	const handleConfirmCancel = (id: string) => {
		cancelAppointment(id, {
			onSettled: () => setCancelTarget(null),
		});
	};

	const handleSaveNotes = (
		id: string,
		body: { purpose?: string; notes?: string },
	) => {
		updateAppointment(
			{ id, body },
			{
				onSuccess: () => {
					setEditNotesTarget(null);
					resetUpdate();
				},
			},
		);
	};

	if (!user) return null;

	return (
		<div className="flex flex-col gap-6">
			{/* Page Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
						<ClipboardList className="h-6 w-6 text-teal-700" />
						<span>Appointments</span>
					</h1>
					<p className="text-xs text-slate-500 mt-0.5">
						{isDoctor
							? "Your scheduled patient visits and consultation records."
							: "Manage patient appointments, track arrivals, and update visit notes."}
					</p>
				</div>

				<div className="flex items-center gap-2">
					<RealtimeIndicator />
					<Button
						variant="outline"
						size="sm"
						onClick={() => void refetch()}
						disabled={isFetching}
						leftIcon={
							<RefreshCw
								className={`h-3.5 w-3.5 ${isFetching ? "animate-spin text-teal-700" : ""}`}
							/>
						}
					>
						Refresh
					</Button>

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

			{/* Filter Controls */}
			<AppointmentFilters
				filters={filters}
				onFiltersChange={setFilters}
				doctors={doctors}
				isDoctorRole={isDoctor}
			/>

			{/* Data Table */}
			<AppointmentTable
				appointments={data?.items || []}
				meta={data?.meta}
				isLoading={isLoading}
				userRole={user.role}
				onPageChange={handlePageChange}
				onMarkArrived={markArrived}
				onComplete={completeAppointment}
				onOpenCancel={setCancelTarget}
				onOpenEditNotes={setEditNotesTarget}
				onViewDetails={setDetailsTarget}
				isActionPending={isActionPending}
				error={appointmentsError}
			/>

			{/* Cancel Confirmation Dialog */}
			<CancelDialog
				appointment={cancelTarget}
				isOpen={Boolean(cancelTarget)}
				onClose={() => setCancelTarget(null)}
				onConfirm={handleConfirmCancel}
				isLoading={isCancelling}
			/>

			{/* Edit Consultation Notes Modal */}
			<EditNotesModal
				appointment={editNotesTarget}
				isOpen={Boolean(editNotesTarget)}
				onClose={() => {
					setEditNotesTarget(null);
					resetUpdate();
				}}
				onSave={handleSaveNotes}
				isLoading={isUpdating}
				error={updateError}
			/>

			{/* Appointment Full Details Modal */}
			<AppointmentDetailsModal
				appointment={detailsTarget}
				isOpen={Boolean(detailsTarget)}
				onClose={() => setDetailsTarget(null)}
			/>
		</div>
	);
}
