import type { DoctorDto, SlotDto } from "@emr/shared";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, RefreshCw, Stethoscope } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../../../shared/components/ui/Button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "../../../shared/components/ui/Card";
import { listDoctorsApi } from "../api/scheduler.api";
import { BookingModal } from "../components/BookingModal";
import { DateCalendarPicker } from "../components/DateCalendarPicker";
import { DoctorSelector } from "../components/DoctorSelector";
import { SlotGrid } from "../components/SlotGrid";
import { SlotLegend } from "../components/SlotLegend";
import { useSlotsQuery } from "../hooks/use-slots-query";

export function SchedulerPage() {
	// Initialize with today's date in local YYYY-MM-DD
	const getToday = () => {
		const now = new Date();
		return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
	};

	const [selectedDate, setSelectedDate] = useState<string>(getToday);
	const [selectedDepartment, setSelectedDepartment] = useState<string>("");
	const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
	const [selectedSlot, setSelectedSlot] = useState<SlotDto | null>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);

	// Fetch all doctors
	const {
		data: doctors = [],
		isLoading: isDoctorsLoading,
		refetch: refetchDoctors,
	} = useQuery<DoctorDto[]>({
		queryKey: ["doctors"],
		queryFn: listDoctorsApi,
		staleTime: 60_000,
	});

	// Auto-select first doctor once loaded
	useEffect(() => {
		if (doctors.length > 0 && !selectedDoctorId) {
			setSelectedDoctorId(doctors[0].id);
		}
	}, [doctors, selectedDoctorId]);

	// Fetch dynamic slots for the selected doctor and date
	const {
		data: slots = [],
		isLoading: isSlotsLoading,
		isFetching: isSlotsFetching,
		error: slotsError,
		refetch: refetchSlots,
	} = useSlotsQuery(selectedDoctorId, selectedDate);

	const currentDoctor = doctors.find((d) => d.id === selectedDoctorId);

	const handleSlotSelect = (slot: SlotDto) => {
		setSelectedSlot(slot);
		setIsModalOpen(true);
	};

	return (
		<div className="flex flex-col gap-6">
			{/* Page Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
						<CalendarClock className="h-6 w-6 text-teal-700" />
						<span>Appointment Scheduler</span>
					</h1>
					<p className="text-xs text-slate-500 mt-0.5">
						Check doctor availability and schedule patient appointments.
					</p>
				</div>

				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => {
							void refetchDoctors();
							void refetchSlots();
						}}
						disabled={isSlotsFetching}
						leftIcon={
							<RefreshCw
								className={`h-3.5 w-3.5 ${isSlotsFetching ? "animate-spin text-teal-700" : ""}`}
							/>
						}
					>
						Refresh
					</Button>
				</div>
			</div>

			{/* Filters & Configuration Card */}
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="text-sm font-semibold flex items-center justify-between">
						<span>Select Doctor & Date</span>
						{isSlotsFetching && !isSlotsLoading && (
							<span className="text-[11px] font-normal text-teal-700 flex items-center gap-1.5 font-mono">
								<span className="h-2 w-2 rounded-full bg-teal-600 animate-pulse" />
								Checking schedule...
							</span>
						)}
					</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-4">
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
						<div className="lg:col-span-2">
							<DoctorSelector
								doctors={doctors}
								selectedDepartment={selectedDepartment}
								selectedDoctorId={selectedDoctorId}
								onDepartmentChange={setSelectedDepartment}
								onDoctorChange={(id) => {
									setSelectedDoctorId(id);
									setSelectedSlot(null);
								}}
								isLoading={isDoctorsLoading}
							/>
						</div>

						<div className="lg:col-span-1">
							<DateCalendarPicker
								selectedDate={selectedDate}
								onDateChange={(d) => {
									setSelectedDate(d);
									setSelectedSlot(null);
								}}
							/>
						</div>
					</div>

					{/* Current Doctor Working Info Banner */}
					{currentDoctor && (
						<div className="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-slate-50 text-xs text-slate-600 border border-slate-200/60">
							<div className="flex items-center gap-1.5 font-semibold text-slate-800">
								<Stethoscope className="h-4 w-4 text-teal-700" />
								<span>{currentDoctor.name}</span>
							</div>
							<span className="text-slate-300">|</span>
							<span>
								Slot Duration:{" "}
								<strong className="text-slate-800 font-mono">
									{currentDoctor.schedule.slotDuration} mins
								</strong>
							</span>
							<span className="text-slate-300">|</span>
							<span>
								Sessions:{" "}
								<span className="font-mono text-slate-800">
									{currentDoctor.schedule.sessions
										.map((s) => `${s.start}–${s.end}`)
										.join(", ")}
								</span>
							</span>
							{currentDoctor.schedule.breaks.length > 0 && (
								<>
									<span className="text-slate-300">|</span>
									<span>
										Break:{" "}
										<span className="font-mono text-slate-800">
											{currentDoctor.schedule.breaks
												.map((b) => `${b.start}–${b.end}`)
												.join(", ")}
										</span>
									</span>
								</>
							)}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Interactive Slots Card */}
			<Card>
				<CardHeader className="pb-3 flex flex-col gap-3">
					<div className="flex items-center justify-between">
						<CardTitle className="text-sm font-semibold">
							Available Time Slots for {selectedDate}
						</CardTitle>
					</div>
					<SlotLegend />
				</CardHeader>

				<CardContent>
					<SlotGrid
						slots={slots}
						selectedDate={selectedDate}
						selectedSlot={selectedSlot}
						onSelectSlot={handleSlotSelect}
						isLoading={isSlotsLoading}
						error={slotsError}
					/>
				</CardContent>
			</Card>

			{/* Booking Modal */}
			{currentDoctor && selectedSlot && (
				<BookingModal
					isOpen={isModalOpen}
					onClose={() => {
						setIsModalOpen(false);
						setSelectedSlot(null);
					}}
					doctor={currentDoctor}
					date={selectedDate}
					slot={selectedSlot}
					onBookingComplete={() => {
						setSelectedSlot(null);
					}}
				/>
			)}
		</div>
	);
}
