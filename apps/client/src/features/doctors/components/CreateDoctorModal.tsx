import { type CreateDoctorBody, createDoctorSchema } from "@emr/shared";
import { type FormEvent, useEffect, useState } from "react";
import { getErrorMessage } from "../../../shared/api/api-errors";
import { Button } from "../../../shared/components/ui/Button";
import { Input } from "../../../shared/components/ui/Input";
import { Modal } from "../../../shared/components/ui/Modal";
import { Select } from "../../../shared/components/ui/Select";

export interface CreateDoctorModalProps {
	isOpen: boolean;
	onClose: () => void;
	onCreate: (data: CreateDoctorBody) => void;
	isLoading?: boolean;
	error?: unknown;
}

export function CreateDoctorModal({
	isOpen,
	onClose,
	onCreate,
	isLoading = false,
	error,
}: CreateDoctorModalProps) {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [department, setDepartment] = useState("General Medicine");
	const [slotDuration, setSlotDuration] = useState<number>(15);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	useEffect(() => {
		if (isOpen) {
			setErrorMessage(null);
		}
	}, [isOpen]);

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();
		setErrorMessage(null);

		const candidate: CreateDoctorBody = {
			name: name.trim(),
			email: email.trim(),
			password,
			department: department.trim(),
			schedule: {
				workingDays: [1, 2, 3, 4, 5],
				sessions: [
					{ start: "09:00", end: "12:00" },
					{ start: "13:00", end: "17:00" },
				],
				breaks: [{ start: "12:00", end: "13:00" }],
				slotDuration,
			},
		};

		const validation = createDoctorSchema.safeParse(candidate);
		if (!validation.success) {
			setErrorMessage(validation.error.issues[0].message);
			return;
		}

		onCreate(validation.data);
	};

	const displayError = errorMessage || (error ? getErrorMessage(error) : null);

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title="Register New Physician"
			description="Creates a clinician user account and sets up standard session schedules."
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
						Create Physician
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

				<Input
					label="Physician Full Name"
					placeholder="e.g. Dr. Robert House"
					value={name}
					onChange={(e) => setName(e.target.value)}
				/>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<Input
						label="Work Email"
						type="email"
						placeholder="dr.house@emr.local"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
					/>

					<Input
						label="Initial Password"
						type="password"
						placeholder="••••••••••••"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
					/>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<Input
						label="Clinical Department"
						placeholder="e.g. Cardiology, Neurology"
						value={department}
						onChange={(e) => setDepartment(e.target.value)}
					/>

					<Select
						label="Appointment Length"
						value={slotDuration}
						onChange={(e) => setSlotDuration(Number(e.target.value))}
					>
						<option value={10}>10 Minutes</option>
						<option value={15}>15 Minutes (Standard)</option>
						<option value={20}>20 Minutes</option>
						<option value={30}>30 Minutes</option>
						<option value={45}>45 Minutes</option>
					</Select>
				</div>

				<p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
					* Standard clinic hours default to Mon–Fri (09:00–12:00, 13:00–17:00
					with lunch break 12:00–13:00). You can customize consultation sessions
					at any time.
				</p>
			</form>
		</Modal>
	);
}
