import type { Role } from "@emr/shared";
import { ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/Button";

export interface RoleGuardProps {
	allowedRoles: Role[];
	children?: ReactNode;
	fallback?: "forbidden" | "redirect";
}

export function RoleGuard({
	allowedRoles,
	children,
	fallback = "forbidden",
}: RoleGuardProps) {
	const { user, hasRole } = useAuth();

	if (!user) {
		return <Navigate to="/login" replace />;
	}

	if (!hasRole(allowedRoles)) {
		if (fallback === "redirect") {
			return <Navigate to="/dashboard" replace />;
		}

		return (
			<div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
				<div className="h-14 w-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 border border-rose-100 shadow-xs">
					<ShieldAlert className="h-7 w-7" />
				</div>
				<h2 className="text-lg font-bold text-slate-900 tracking-tight">
					Access Restricted
				</h2>
				<p className="text-xs text-slate-500 max-w-sm mt-1 mb-6">
					Your assigned role ({user.role}) does not have permission to access
					this clinical management view.
				</p>
				<Link to="/dashboard">
					<Button variant="outline" size="sm">
						Return to Dashboard
					</Button>
				</Link>
			</div>
		);
	}

	return <>{children}</>;
}
