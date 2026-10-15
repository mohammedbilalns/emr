import type { AppointmentDto } from "@emr/shared";
import { AlertTriangle } from "lucide-react";
import { Button } from "../../../shared/components/ui/Button";
import { Modal } from "../../../shared/components/ui/Modal";

export interface CancelDialogProps {
	appointment: AppointmentDto | null;
	isOpen: boolean;
	onClose: () => void;
	onConfirm: (id: string) => void;
	isLoading?: boolean;
}

export function CancelDialog({
	appointment,
	isOpen,
	onClose,
	onConfirm,
	isLoading = false,
}: CancelDialogProps) {
	if (!appointment) return null;

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title="Cancel Appointment"
			maxWidth="sm"
			footer={
				<div className="flex items-center justify-end gap-2 w-full">
					<Button
						variant="outline"
						size="sm"
						onClick={onClose}
						disabled={isLoading}
					>
						Keep Appointment
					</Button>
					<Button
						variant="danger"
						size="sm"
						onClick={() => onConfirm(appointment.id)}
						isLoading={isLoading}
					>
						Cancel Appointment
					</Button>
				</div>
			}
		>
			<div className="flex flex-col gap-3">
				<div className="flex items-start gap-3 p-3 rounded-xl bg-rose-50 text-rose-800 text-xs border border-rose-100">
					<AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
					<div className="flex flex-col">
						<span className="font-semibold">Cancel Appointment</span>
						<span className="text-[11px] text-rose-700 mt-0.5">
							This will cancel the booking for {appointment.date} at{" "}
							{appointment.startTime} and make the time available for other
							patients.
						</span>
					</div>
				</div>

				<div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
					<div className="flex justify-between">
						<span className="text-slate-500">Patient:</span>
						<span className="font-semibold text-slate-800">
							{appointment.patient.name} ({appointment.patient.patientCode})
						</span>
					</div>
					<div className="flex justify-between">
						<span className="text-slate-500">Physician:</span>
						<span className="font-semibold text-slate-800">
							{appointment.doctor.name}
						</span>
					</div>
					<div className="flex justify-between">
						<span className="text-slate-500">Time:</span>
						<span className="font-mono text-slate-800">
							{appointment.date} {appointment.startTime} - {appointment.endTime}
						</span>
					</div>
				</div>
			</div>
		</Modal>
	);
}
