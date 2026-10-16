import {
	type CreateDoctorBody,
	createDoctorSchema,
	formatFriendlyErrorMessage,
} from "@emr/shared";
import { useQuery } from "@tanstack/react-query";
import { type FormEvent, useEffect, useState } from "react";
import {
	ApiClientError,
	getErrorMessage,
} from "../../../shared/api/api-errors";
import { Button } from "../../../shared/components/ui/Button";
import { Input } from "../../../shared/components/ui/Input";
import { Modal } from "../../../shared/components/ui/Modal";
import { Select } from "../../../shared/components/ui/Select";
import { listDepartmentsApi } from "../api/doctors.api";

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
	const [department, setDepartment] = useState("");
	const [slotDuration, setSlotDuration] = useState<number>(15);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

	const { data: departments = [], isLoading: isLoadingDepts } = useQuery({
		queryKey: ["departments"],
		queryFn: listDepartmentsApi,
		staleTime: 60_000,
	});

	useEffect(() => {
		if (isOpen) {
			setErrorMessage(null);
			setFieldErrors({});
			if (
				departments.length > 0 &&
				!departments.some((d) => d.name === department)
			) {
				setDepartment(departments[0].name);
			}
		}
	}, [isOpen, departments, department]);

	useEffect(() => {
		if (error) {
			if (error instanceof ApiClientError && error.fieldErrors.length > 0) {
				const errors: Record<string, string> = {};
				for (const field of error.fieldErrors) {
					errors[field.path] = field.message;
				}
				setFieldErrors(errors);
			}
		}
	}, [error]);

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();
		setErrorMessage(null);
		setFieldErrors({});

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
			const errors: Record<string, string> = {};
			for (const issue of validation.error.issues) {
				const field = issue.path[issue.path.length - 1];
				if (typeof field === "string") {
					errors[field] = formatFriendlyErrorMessage(
						issue.message,
						field === "name" ? "Physician name" : field,
					);
				}
			}
			setFieldErrors(errors);
			setErrorMessage(
				formatFriendlyErrorMessage(validation.error.issues[0].message),
			);
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
					error={fieldErrors.name}
					onChange={(e) => {
						setName(e.target.value);
						if (fieldErrors.name) {
							setFieldErrors((prev) => ({ ...prev, name: "" }));
						}
					}}
				/>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<Input
						label="Work Email"
						type="email"
						placeholder="dr.house@emr.local"
						value={email}
						error={fieldErrors.email}
						onChange={(e) => {
							setEmail(e.target.value);
							if (fieldErrors.email) {
								setFieldErrors((prev) => ({ ...prev, email: "" }));
							}
						}}
					/>

					<Input
						label="Initial Password"
						type="password"
						placeholder="••••••••••••"
						value={password}
						error={fieldErrors.password}
						onChange={(e) => {
							setPassword(e.target.value);
							if (fieldErrors.password) {
								setFieldErrors((prev) => ({ ...prev, password: "" }));
							}
						}}
					/>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<Select
						id="doctor-department"
						label="Clinical Department"
						value={department}
						error={fieldErrors.department}
						disabled={isLoadingDepts}
						onChange={(e) => {
							setDepartment(e.target.value);
							if (fieldErrors.department) {
								setFieldErrors((prev) => ({ ...prev, department: "" }));
							}
						}}
					>
						{departments.length === 0 ? (
							<option value="">
								{isLoadingDepts
									? "Loading departments..."
									: "No departments available"}
							</option>
						) : (
							departments.map((d) => (
								<option key={d.id} value={d.name}>
									{d.name}
								</option>
							))
						)}
					</Select>

					<Select
						id="doctor-slot-duration"
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
