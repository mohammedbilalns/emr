import { loginSchema } from "@emr/shared";
import { Lock, Mail, ShieldAlert } from "lucide-react";
import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	ApiClientError,
	getErrorMessage,
} from "../../../shared/api/api-errors";
import { Button } from "../../../shared/components/ui/Button";
import { Input } from "../../../shared/components/ui/Input";
import { useAuth } from "../../../shared/context/AuthContext";
import { useToast } from "../../../shared/hooks/use-toast";

export function LoginForm() {
	const { login } = useAuth();
	const navigate = useNavigate();
	const toast = useToast();

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [formError, setFormError] = useState<string | null>(null);
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setFormError(null);
		setFieldErrors({});

		const validation = loginSchema.safeParse({ email, password });
		if (!validation.success) {
			const errors: Record<string, string> = {};
			for (const issue of validation.error.issues) {
				const field = issue.path[0];
				if (typeof field === "string") {
					errors[field] = issue.message;
				}
			}
			setFieldErrors(errors);
			return;
		}

		setIsSubmitting(true);
		try {
			await login(validation.data);
			toast.success("Welcome to Enterprise EMR", "Authenticated");
			navigate("/dashboard", { replace: true });
		} catch (error) {
			if (error instanceof ApiClientError && error.fieldErrors.length > 0) {
				const errors: Record<string, string> = {};
				for (const field of error.fieldErrors) {
					errors[field.path] = field.message;
				}
				setFieldErrors(errors);
			}
			const message = getErrorMessage(error, "Failed to authenticate");
			setFormError(message);
			toast.error(message, "Authentication Failed");
		} finally {
			setIsSubmitting(false);
		}
	};

	const fillCredentials = (userEmail: string, userPass: string) => {
		setEmail(userEmail);
		setPassword(userPass);
		setFormError(null);
		setFieldErrors({});
	};

	return (
		<div className="w-full flex flex-col gap-6">
			{formError && (
				<div className="flex items-center gap-3 p-3.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs">
					<ShieldAlert className="h-4 w-4 shrink-0 text-rose-600" />
					<span className="font-medium">{formError}</span>
				</div>
			)}

			<form onSubmit={handleSubmit} className="flex flex-col gap-4">
				<Input
					label="Work Email Address"
					type="email"
					name="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					placeholder="clinician@emr.local"
					autoComplete="email"
					required
					leftIcon={<Mail className="h-4 w-4" />}
					error={fieldErrors.email}
				/>

				<Input
					label="Password"
					type="password"
					name="password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					placeholder="••••••••••••"
					autoComplete="current-password"
					required
					leftIcon={<Lock className="h-4 w-4" />}
					error={fieldErrors.password}
				/>

				<Button
					type="submit"
					variant="primary"
					size="lg"
					isLoading={isSubmitting}
					className="w-full mt-2 font-semibold"
				>
					Sign In
				</Button>
			</form>

			{/* Staff Role Switcher */}
			<div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
				<span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
					Quick Sign In
				</span>
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
					<button
						type="button"
						onClick={() => fillCredentials("admin@emr.local", "Admin@12345")}
						className="text-left p-2 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
					>
						<span className="block text-xs font-semibold text-slate-800">
							Administrator
						</span>
						<span className="block text-[10px] text-slate-500">
							Clinic Management
						</span>
					</button>

					<button
						type="button"
						onClick={() =>
							fillCredentials("receptionist@emr.local", "Recept@12345")
						}
						className="text-left p-2 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
					>
						<span className="block text-xs font-semibold text-slate-800">
							Receptionist
						</span>
						<span className="block text-[10px] text-slate-500">Front Desk</span>
					</button>

					<button
						type="button"
						onClick={() =>
							fillCredentials("sarah.chen@emr.local", "Doctor@12345")
						}
						className="text-left p-2 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
					>
						<span className="block text-xs font-semibold text-slate-800">
							Doctor
						</span>
						<span className="block text-[10px] text-slate-500">
							Consultations
						</span>
					</button>
				</div>
			</div>
		</div>
	);
}
