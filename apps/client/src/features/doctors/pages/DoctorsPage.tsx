import type {
	CreateDoctorBody,
	DoctorDto,
	UpdateDoctorScheduleBody,
} from "@emr/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, RefreshCw, Stethoscope } from "lucide-react";
import { useState } from "react";
import { getErrorMessage } from "../../../shared/api/api-errors";
import { Button } from "../../../shared/components/ui/Button";
import { Spinner } from "../../../shared/components/ui/Spinner";
import { useToast } from "../../../shared/hooks/use-toast";
import {
	createDoctorApi,
	listDoctorsApi,
	updateDoctorScheduleApi,
} from "../api/doctors.api";
import { CreateDoctorModal } from "../components/CreateDoctorModal";
import { DoctorCard } from "../components/DoctorCard";
import { ScheduleConfigModal } from "../components/ScheduleConfigModal";

export function DoctorsPage() {
	const queryClient = useQueryClient();
	const toast = useToast();

	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [scheduleTarget, setScheduleTarget] = useState<DoctorDto | null>(null);

	const {
		data: doctors = [],
		isLoading,
		isFetching,
		refetch,
	} = useQuery<DoctorDto[]>({
		queryKey: ["doctors"],
		queryFn: listDoctorsApi,
	});

	const createMutation = useMutation({
		mutationFn: (body: CreateDoctorBody) => createDoctorApi(body),
		onSuccess: (newDoc) => {
			toast.success(
				`${newDoc.name} registered to ${newDoc.department}`,
				"Physician Created",
			);
			void queryClient.invalidateQueries({ queryKey: ["doctors"] });
		},
		onError: (error) => {
			toast.error(
				getErrorMessage(error, "Failed to create doctor"),
				"Registration Error",
			);
		},
	});

	const updateScheduleMutation = useMutation({
		mutationFn: ({
			id,
			schedule,
		}: {
			id: string;
			schedule: UpdateDoctorScheduleBody["schedule"];
		}) => updateDoctorScheduleApi(id, { schedule }),
		onSuccess: (updated) => {
			toast.success(`Schedule updated for ${updated.name}`, "Schedule Saved");
			void queryClient.invalidateQueries({ queryKey: ["doctors"] });
			void queryClient.invalidateQueries({ queryKey: ["slots"] });
		},
		onError: (error) => {
			toast.error(
				getErrorMessage(error, "Failed to update schedule"),
				"Schedule Error",
			);
		},
	});

	const handleSaveSchedule = (
		id: string,
		schedule: UpdateDoctorScheduleBody["schedule"],
	) => {
		updateScheduleMutation.mutate(
			{ id, schedule },
			{
				onSuccess: () => {
					setScheduleTarget(null);
					updateScheduleMutation.reset();
				},
			},
		);
	};

	return (
		<div className="flex flex-col gap-6">
			{/* Page Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
						<Stethoscope className="h-6 w-6 text-teal-700" />
						<span>Doctor Schedules</span>
					</h1>
					<p className="text-xs text-slate-500 mt-0.5">
						Set consultation hours, daily clinic sessions, break times, and
						appointment lengths for each doctor.
					</p>
				</div>

				<div className="flex items-center gap-2">
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

					<Button
						variant="primary"
						size="sm"
						onClick={() => setIsCreateOpen(true)}
						leftIcon={<Plus className="h-4 w-4" />}
					>
						Add Physician
					</Button>
				</div>
			</div>

			{/* Doctors Cards Grid */}
			{isLoading ? (
				<div className="flex flex-col items-center justify-center p-16 gap-3 min-h-[300px]">
					<Spinner size="lg" className="text-teal-700" />
					<span className="text-xs font-medium text-slate-500">
						Loading medical staff roster...
					</span>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{doctors.map((doctor) => (
						<DoctorCard
							key={doctor.id}
							doctor={doctor}
							onEditSchedule={setScheduleTarget}
						/>
					))}
				</div>
			)}

			{/* Create Doctor Dialog */}
			<CreateDoctorModal
				isOpen={isCreateOpen}
				onClose={() => {
					setIsCreateOpen(false);
					createMutation.reset();
				}}
				onCreate={(body) => {
					createMutation.mutate(body, {
						onSuccess: () => {
							setIsCreateOpen(false);
							createMutation.reset();
						},
					});
				}}
				isLoading={createMutation.isPending}
				error={createMutation.error}
			/>

			{/* Edit Schedule Dialog */}
			<ScheduleConfigModal
				doctor={scheduleTarget}
				isOpen={Boolean(scheduleTarget)}
				onClose={() => {
					setScheduleTarget(null);
					updateScheduleMutation.reset();
				}}
				onSave={handleSaveSchedule}
				isLoading={updateScheduleMutation.isPending}
				error={updateScheduleMutation.error}
			/>
		</div>
	);
}
