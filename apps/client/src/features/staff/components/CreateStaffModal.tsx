import { type CreateStaffBody, createStaffSchema } from "@emr/shared";
import { type FormEvent, useState } from "react";
import { Button } from "../../../shared/components/ui/Button";
import { Input } from "../../../shared/components/ui/Input";
import { Modal } from "../../../shared/components/ui/Modal";

export interface CreateStaffModalProps {
	isOpen: boolean;
	onClose: () => void;
	onCreate: (data: CreateStaffBody) => void;
	isLoading?: boolean;
}

export function CreateStaffModal({
	isOpen,
	onClose,
	onCreate,
	isLoading = false,
}: CreateStaffModalProps) {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();
		setErrorMessage(null);

		const candidate: CreateStaffBody = {
			name: name.trim(),
			email: email.trim(),
			password,
		};

		const validation = createStaffSchema.safeParse(candidate);
		if (!validation.success) {
			setErrorMessage(validation.error.issues[0].message);
			return;
		}

		onCreate(validation.data);
		onClose();
	};

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
			<form onSubmit={handleSubmit} className="flex flex-col gap-4">
				{errorMessage && (
					<div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium">
						{errorMessage}
					</div>
				)}

				<Input
					label="Staff Full Name"
					placeholder="e.g. Clara Oswald"
					value={name}
					onChange={(e) => setName(e.target.value)}
					required
				/>

				<Input
					label="Work Email Address"
					type="email"
					placeholder="clara@emr.local"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					required
				/>

				<Input
					label="Initial Password (min 8 characters)"
					type="password"
					placeholder="••••••••••••"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					required
				/>

				<p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
					* Receptionist duties: Search patient records, register new patients,
					schedule appointments, and check in arriving patients.
				</p>
			</form>
		</Modal>
	);
}
