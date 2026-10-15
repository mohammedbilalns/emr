import {
	type CreateStaffBody,
	createStaffSchema,
	formatFriendlyErrorMessage,
} from "@emr/shared";
import { type FormEvent, useEffect, useState } from "react";
import {
	ApiClientError,
	getErrorMessage,
} from "../../../shared/api/api-errors";
import { Button } from "../../../shared/components/ui/Button";
import { Input } from "../../../shared/components/ui/Input";
import { Modal } from "../../../shared/components/ui/Modal";

export interface CreateStaffModalProps {
	isOpen: boolean;
	onClose: () => void;
	onCreate: (data: CreateStaffBody) => void;
	isLoading?: boolean;
	error?: unknown;
}

export function CreateStaffModal({
	isOpen,
	onClose,
	onCreate,
	isLoading = false,
	error,
}: CreateStaffModalProps) {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

	useEffect(() => {
		if (isOpen) {
			setErrorMessage(null);
			setFieldErrors({});
		}
	}, [isOpen]);

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

		const candidate: CreateStaffBody = {
			name: name.trim(),
			email: email.trim(),
			password,
		};

		const validation = createStaffSchema.safeParse(candidate);
		if (!validation.success) {
			const errors: Record<string, string> = {};
			for (const issue of validation.error.issues) {
				const field = issue.path[issue.path.length - 1];
				if (typeof field === "string") {
					errors[field] = formatFriendlyErrorMessage(
						issue.message,
						field === "name" ? "Staff name" : field,
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
			title="Register Receptionist Staff"
			description="Grants appointment booking, patient intake, and arrival management access."
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
						Register Receptionist
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
					label="Staff Full Name"
					placeholder="e.g. Clara Oswald"
					value={name}
					error={fieldErrors.name}
					onChange={(e) => {
						setName(e.target.value);
						if (fieldErrors.name) {
							setFieldErrors((prev) => ({ ...prev, name: "" }));
						}
					}}
				/>

				<Input
					label="Work Email Address"
					type="email"
					placeholder="clara@emr.local"
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
					label="Initial Password (min 8 characters)"
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

				<p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
					* Receptionist duties: Search patient records, register new patients,
					schedule appointments, and check in arriving patients.
				</p>
			</form>
		</Modal>
	);
}
