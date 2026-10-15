import type { AppointmentDto } from "@emr/shared";
import { FileText, Stethoscope, User } from "lucide-react";

import { Button } from "../../../shared/components/ui/Button";
import { Modal } from "../../../shared/components/ui/Modal";
import { StatusBadge } from "./StatusBadge";

export interface AppointmentDetailsModalProps {
	appointment: AppointmentDto | null;
	isOpen: boolean;
	onClose: () => void;
}

export function AppointmentDetailsModal({
	appointment,
	isOpen,
	onClose,
}: AppointmentDetailsModalProps) {
	if (!appointment) return null;

	const steps: Array<{ key: string; label: string }> = [
		{ key: "SCHEDULED", label: "Scheduled" },
		{ key: "ARRIVED", label: "Arrived at Clinic" },
		{ key: "COMPLETED", label: "Completed" },
	];

	const isCancelled = appointment.status === "CANCELLED";

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title="Clinical Appointment Record"
			description={`Appointment ID: ${appointment.id}`}
			maxWidth="md"
			footer={
				<Button variant="outline" size="sm" onClick={onClose}>
					Close Record
				</Button>
			}
		>
			<div className="flex flex-col gap-5 text-xs">
				{/* Workflow State Stepper */}
				<div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 flex flex-col gap-2">
					<div className="flex items-center justify-between">
						<span className="font-semibold text-slate-700">
							Workflow Progress
						</span>
						<StatusBadge status={appointment.status} size="sm" />
					</div>

					{!isCancelled ? (
						<div className="flex items-center justify-between pt-2">
							{steps.map((step, idx) => {
								const currentIdx = steps.findIndex(
									(s) => s.key === appointment.status,
								);
								const isDone = currentIdx >= idx;
								const isCurrent = currentIdx === idx;

								return (
									<div
										key={step.key}
										className="flex-1 flex flex-col items-center relative"
									>
										{/* Line between steps */}
										{idx > 0 && (
											<div
												className={`absolute top-2.5 -left-1/2 w-full h-0.5 ${
													isDone ? "bg-teal-600" : "bg-slate-200"
												}`}
											/>
										)}
										<div
											className={`relative z-10 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
												isDone
													? "bg-teal-700 text-white"
													: "bg-slate-200 text-slate-600"
											} ${isCurrent ? "ring-2 ring-teal-200" : ""}`}
										>
											{isDone ? "✓" : idx + 1}
										</div>
										<span
											className={`text-[10px] mt-1 text-center font-medium ${
												isCurrent ? "text-teal-900 font-bold" : "text-slate-500"
											}`}
										>
											{step.label}
										</span>
									</div>
								);
							})}
						</div>
					) : (
						<p className="text-[11px] text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-200">
							This appointment has been cancelled and its slot was returned to
							the open booking pool.
						</p>
					)}
				</div>

				{/* Two-Column Info Cards */}
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
					{/* Patient Details */}
					<div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
						<div className="flex items-center gap-1.5 font-semibold text-slate-800 mb-2">
							<User className="h-4 w-4 text-teal-700" />
							<span>Patient Record</span>
						</div>
						<div className="text-slate-900 font-medium">
							{appointment.patient.name}
						</div>
						<div className="text-slate-500 font-mono text-[11px]">
							ID: {appointment.patient.patientCode}
						</div>
						<div className="text-slate-500 font-mono text-[11px]">
							Phone: {appointment.patient.mobile}
						</div>
					</div>

					{/* Doctor Details */}
					<div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
						<div className="flex items-center gap-1.5 font-semibold text-slate-800 mb-2">
							<Stethoscope className="h-4 w-4 text-teal-700" />
							<span>Physician & Schedule</span>
						</div>
						<div className="text-slate-900 font-medium">
							{appointment.doctor.name}
						</div>
						<div className="text-slate-500 text-[11px]">
							Dept: {appointment.doctor.department}
						</div>
						<div className="text-slate-500 font-mono text-[11px]">
							{appointment.date} · {appointment.startTime} –{" "}
							{appointment.endTime}
						</div>
					</div>
				</div>

				{/* Purpose */}
				<div className="p-3 rounded-xl border border-slate-200 bg-white">
					<span className="block font-semibold text-slate-700 mb-1">
						Chief Complaint / Visit Purpose:
					</span>
					<p className="text-slate-800 bg-slate-50 p-2 rounded-lg">
						{appointment.purpose || "No specific purpose recorded."}
					</p>
				</div>

				{/* Clinical Consultation Notes */}
				<div className="p-3 rounded-xl border border-slate-200 bg-white">
					<div className="flex items-center gap-1.5 font-semibold text-slate-700 mb-1">
						<FileText className="h-4 w-4 text-teal-700" />
						<span>Doctor Consultation Notes:</span>
					</div>
					<p className="text-slate-800 bg-slate-50 p-2.5 rounded-lg whitespace-pre-wrap font-sans leading-relaxed">
						{appointment.notes || "No clinical consultation notes entered yet."}
					</p>
				</div>
			</div>
		</Modal>
	);
}
