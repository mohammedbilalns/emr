import {
	type DoctorDto,
	formatFriendlyErrorMessage,
	type UpdateDoctorBody,
	updateDoctorSchema,
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

export interface EditDoctorModalProps {
	doctor: DoctorDto | null;
	isOpen: boolean;
	onClose: () => void;
	onUpdate: (id: string, data: UpdateDoctorBody) => void;
	isLoading?: boolean;
	error?: unknown;
}

export function EditDoctorModal({
	doctor,
	isOpen,
	onClose,
	onUpdate,
	isLoading = false,
	error,
}: EditDoctorModalProps) {
	const [name, setName] = useState("");
	const [department, setDepartment] = useState("");
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

	const { data: departments = [], isLoading: isLoadingDepts } = useQuery({
		queryKey: ["departments"],
		queryFn: listDepartmentsApi,
		staleTime: 60_000,
	});

	useEffect(() => {
		if (doctor && isOpen) {
			setName(doctor.name);
			setDepartment(doctor.department);
			setErrorMessage(null);
			setFieldErrors({});
		}
	}, [doctor, isOpen]);

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
		if (!doctor) return;

		setErrorMessage(null);
		setFieldErrors({});

		const candidate: UpdateDoctorBody = {
			name: name.trim(),
			department: department.trim(),
		};

		const validation = updateDoctorSchema.safeParse(candidate);
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

		onUpdate(doctor.id, validation.data);
	};

	const displayError = errorMessage || (error ? getErrorMessage(error) : null);

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title={`Edit Physician: ${doctor?.name ?? ""}`}
			description="Update clinician details and clinical department assignment."
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

				<Input
					id="edit-doctor-name"
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

				<Select
					id="edit-doctor-department"
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
						<option value={department}>
							{isLoadingDepts
								? "Loading departments..."
								: department || "No departments available"}
						</option>
					) : (
						departments.map((d) => (
							<option key={d.id} value={d.name}>
								{d.name}
							</option>
						))
					)}
				</Select>
			</form>
		</Modal>
	);
}
