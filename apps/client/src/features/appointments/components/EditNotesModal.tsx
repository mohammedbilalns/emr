import type { AppointmentDto, UpdateAppointmentBody } from "@emr/shared";
import { type FormEvent, useEffect, useState } from "react";
import { getErrorMessage } from "../../../shared/api/api-errors";
import { Button } from "../../../shared/components/ui/Button";
import { Modal } from "../../../shared/components/ui/Modal";

export interface EditNotesModalProps {
	appointment: AppointmentDto | null;
	isOpen: boolean;
	onClose: () => void;
	onSave: (id: string, body: UpdateAppointmentBody) => void;
	isLoading?: boolean;
	error?: unknown;
}

export function EditNotesModal({
	appointment,
	isOpen,
	onClose,
	onSave,
	isLoading = false,
	error,
}: EditNotesModalProps) {
	const [purpose, setPurpose] = useState("");
	const [notes, setNotes] = useState("");

	useEffect(() => {
		if (appointment) {
			setPurpose(appointment.purpose || "");
			setNotes(appointment.notes || "");
		}
	}, [appointment]);

	if (!appointment) return null;

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();
		onSave(appointment.id, {
			purpose: purpose.trim() || undefined,
			notes: notes.trim() || undefined,
		});
	};

	const displayError = error
		? getErrorMessage(error, "Failed to update consultation details")
		: null;

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title="Update Consultation Details"
			description={`Patient: ${appointment.patient.name} (${appointment.patient.patientCode})`}
			maxWidth="md"
			footer={
				<div className="flex items-center justify-end gap-2 w-full">
					<Button
						variant="outline"
						size="sm"
						onClick={onClose}
						disabled={isLoading}
					>
						Cancel
					</Button>
					<Button
						variant="primary"
						size="sm"
						onClick={handleSubmit}
						isLoading={isLoading}
					>
						Save Changes
					</Button>
				</div>
			}
		>
			<form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
				{displayError && (
					<div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium">
						{displayError}
					</div>
				)}
				<div className="flex flex-col gap-1.5">
					<label
						htmlFor="edit-purpose"
						className="text-xs font-semibold text-slate-700 tracking-wide"
					>
						Visit Purpose / Chief Complaint
					</label>
					<input
						id="edit-purpose"
						type="text"
						maxLength={300}
						value={purpose}
						onChange={(e) => setPurpose(e.target.value)}
						placeholder="e.g. Follow-up consultation, ECG checkup"
						className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
					/>
				</div>

				<div className="flex flex-col gap-1.5">
					<label
						htmlFor="edit-notes"
						className="text-xs font-semibold text-slate-700 tracking-wide"
					>
						Clinical Consultation Notes
					</label>
					<textarea
						id="edit-notes"
						rows={5}
						maxLength={2000}
						value={notes}
						onChange={(e) => setNotes(e.target.value)}
						placeholder="Clinical observations, diagnoses, prescriptions, treatment advice..."
						className="w-full rounded-lg border border-slate-300 bg-white p-3 text-xs text-slate-900 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 font-sans leading-relaxed"
					/>
				</div>
			</form>
		</Modal>
	);
}
