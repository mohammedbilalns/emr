import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Spinner } from "../ui/Spinner";

/**
 * GuestRoute ensures that authenticated users cannot access guest-only routes
 * such as the login page. Any authenticated user attempting to navigate to or
 * move back to /login will be immediately redirected to /dashboard.
 */
export function GuestRoute() {
	const { isAuthenticated, isLoading } = useAuth();

	if (isLoading) {
		return (
			<div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 gap-3">
				<Spinner size="lg" className="text-teal-400" />
			</div>
		);
	}

	if (isAuthenticated) {
		return <Navigate to="/dashboard" replace />;
	}

	return <Outlet />;
}
