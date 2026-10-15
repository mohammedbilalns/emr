import {
	type CreateAppointmentBody,
	createAppointmentSchema,
	type DoctorDto,
	type PatientDto,
	type SlotDto,
} from "@emr/shared";
import {
	AlertTriangle,
	Clock,
	Stethoscope,
	User,
	UserPlus,
} from "lucide-react";
import { type FormEvent, useState } from "react";
import {
	ApiClientError,
	getErrorMessage,
} from "../../../shared/api/api-errors";
import { Button } from "../../../shared/components/ui/Button";
import { Input } from "../../../shared/components/ui/Input";
import { Modal } from "../../../shared/components/ui/Modal";
import { Select } from "../../../shared/components/ui/Select";
import { useBookSlot } from "../hooks/use-book-slot";
import { PatientPicker } from "./PatientPicker";

export interface BookingModalProps {
	isOpen: boolean;
	onClose: () => void;
	doctor: DoctorDto;
	date: string;
	slot: SlotDto;
	onBookingComplete: () => void;
}

export function BookingModal({
	isOpen,
	onClose,
	doctor,
	date,
	slot,
	onBookingComplete,
}: BookingModalProps) {
	const [patientType, setPatientType] = useState<"EXISTING" | "NEW">(
		"EXISTING",
	);
	const [selectedExistingPatient, setSelectedExistingPatient] =
		useState<PatientDto | null>(null);

	// New patient fields
	const [newName, setNewName] = useState("");
	const [newMobile, setNewMobile] = useState("");
	const [newGender, setNewGender] = useState<"MALE" | "FEMALE" | "OTHER">(
		"FEMALE",
	);
	const [newDob, setNewDob] = useState("");
	const [purpose, setPurpose] = useState("");

	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
	const [serverError, setServerError] = useState<string | null>(null);

	const { mutate: bookSlot, isPending } = useBookSlot(() => {
		onBookingComplete();
		onClose();
	});

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();
		setFieldErrors({});
		setServerError(null);

		let patientPayload: CreateAppointmentBody["patient"];

		if (patientType === "EXISTING") {
			if (!selectedExistingPatient) {
				setFieldErrors({
					patientId: "Please search and select an existing patient",
				});
				return;
			}
			patientPayload = {
				type: "EXISTING",
				patientId: selectedExistingPatient.id,
			};
		} else {
			patientPayload = {
				type: "NEW",
				name: newName.trim(),
				mobile: newMobile.trim(),
				gender: newGender,
				dateOfBirth: newDob.trim() || undefined,
			};
		}

		const fullPayload: CreateAppointmentBody = {
			doctorId: doctor.id,
			date,
			startTime: slot.startTime,
			patient: patientPayload,
			purpose: purpose.trim() || undefined,
		};

		const validation = createAppointmentSchema.safeParse(fullPayload);
		if (!validation.success) {
			const errors: Record<string, string> = {};
			for (const issue of validation.error.issues) {
				const field = issue.path[issue.path.length - 1];
				if (typeof field === "string") {
					errors[field] = issue.message;
				}
			}
			setFieldErrors(errors);
			return;
		}

		bookSlot(validation.data, {
			onError: (error) => {
				if (error instanceof ApiClientError && error.fieldErrors.length > 0) {
					const errors: Record<string, string> = {};
					for (const field of error.fieldErrors) {
						errors[field.path] = field.message;
					}
					setFieldErrors(errors);
				}
				const msg = getErrorMessage(error, "Failed to book appointment");
				setServerError(msg);
			},
		});
	};

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title="Schedule Appointment"
			description="Confirm patient details and schedule this doctor consultation."
			maxWidth="lg"
			footer={
				<div className="flex items-center justify-end gap-2 w-full">
					<Button
						variant="outline"
						size="sm"
						onClick={onClose}
						disabled={isPending}
					>
						Cancel
					</Button>
					<Button
						variant="primary"
						size="sm"
						onClick={handleSubmit}
						isLoading={isPending}
					>
						Confirm Appointment
					</Button>
				</div>
			}
		>
			<form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
				{serverError && (
					<div className="flex items-center gap-3 p-3.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs font-medium">
						<AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
						<span>{serverError}</span>
					</div>
				)}

				{/* Appointment Overview Summary Pill */}
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl border border-slate-200/80 bg-slate-50 text-xs">
					<div className="flex items-center gap-2">
						<Stethoscope className="h-4 w-4 text-teal-700 shrink-0" />
						<div className="flex flex-col">
							<span className="text-[10px] uppercase font-semibold text-slate-400">
								Doctor
							</span>
							<span className="font-semibold text-slate-800">
								{doctor.name} ({doctor.department})
							</span>
						</div>
					</div>

					<div className="flex items-center gap-2">
						<Clock className="h-4 w-4 text-teal-700 shrink-0" />
						<div className="flex flex-col">
							<span className="text-[10px] uppercase font-semibold text-slate-400">
								Date & Time
							</span>
							<span className="font-semibold text-slate-800 font-mono">
								{date} @ {slot.startTime} – {slot.endTime}
							</span>
						</div>
					</div>
				</div>

				{/* Patient Type Segmented Controller */}
				<div className="flex flex-col gap-1.5">
					<span className="text-xs font-semibold text-slate-700 tracking-wide">
						Patient Registration Type
					</span>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
						<button
							type="button"
							onClick={() => {
								setPatientType("EXISTING");
								setFieldErrors({});
							}}
							className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
								patientType === "EXISTING"
									? "bg-white text-teal-800 shadow-xs"
									: "text-slate-600 hover:text-slate-900"
							}`}
						>
							<User className="h-3.5 w-3.5" />
							<span>Existing Patient</span>
						</button>

						<button
							type="button"
							onClick={() => {
								setPatientType("NEW");
								setFieldErrors({});
							}}
							className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
								patientType === "NEW"
									? "bg-white text-teal-800 shadow-xs"
									: "text-slate-600 hover:text-slate-900"
							}`}
						>
							<UserPlus className="h-3.5 w-3.5" />
							<span>New Patient Registration</span>
						</button>
					</div>
				</div>

				{/* Conditional Form Inputs */}
				{patientType === "EXISTING" ? (
					<PatientPicker
						selectedPatient={selectedExistingPatient}
						onSelectPatient={setSelectedExistingPatient}
						error={fieldErrors.patientId}
					/>
				) : (
					<div className="flex flex-col gap-3 p-3.5 rounded-xl border border-slate-200 bg-white">
						<Input
							label="Patient Full Name"
							placeholder="e.g. Jane Doe"
							value={newName}
							onChange={(e) => setNewName(e.target.value)}
							error={fieldErrors.name}
						/>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							<Input
								label="Mobile Number (10 Digits)"
								placeholder="9876543201"
								type="tel"
								maxLength={10}
								value={newMobile}
								onChange={(e) => setNewMobile(e.target.value)}
								error={fieldErrors.mobile}
							/>

							<Select
								label="Gender"
								value={newGender}
								onChange={(e) =>
									setNewGender(e.target.value as "MALE" | "FEMALE" | "OTHER")
								}
								error={fieldErrors.gender}
							>
								<option value="FEMALE">Female</option>
								<option value="MALE">Male</option>
								<option value="OTHER">Other</option>
							</Select>
						</div>

						<Input
							label="Date of Birth (Optional)"
							type="date"
							value={newDob}
							onChange={(e) => setNewDob(e.target.value)}
							error={fieldErrors.dateOfBirth}
						/>
					</div>
				)}

				{/* Consultation Purpose */}
				<div className="flex flex-col gap-1.5">
					<label
						htmlFor="purpose-textarea"
						className="text-xs font-semibold text-slate-700 tracking-wide"
					>
						Consultation Purpose / Reason for Visit (Optional)
					</label>
					<textarea
						id="purpose-textarea"
						rows={2}
						maxLength={300}
						value={purpose}
						onChange={(e) => setPurpose(e.target.value)}
						placeholder="Brief reason for consultation (e.g. Follow-up ECG, General checkup, Routine evaluation)"
						className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-900 transition-colors focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 placeholder:text-slate-400"
					/>
					{fieldErrors.purpose && (
						<p className="text-xs text-rose-600 font-medium">
							{fieldErrors.purpose}
						</p>
					)}
				</div>
			</form>
		</Modal>
	);
}
