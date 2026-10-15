import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Spinner } from "../ui/Spinner";

/**
 * Route guard that restricts guest-only pages (such as /login) from authenticated users.
 * Redirects authenticated sessions directly to /dashboard.
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
