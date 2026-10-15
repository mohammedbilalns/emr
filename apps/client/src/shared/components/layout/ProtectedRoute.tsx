import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Spinner } from "../ui/Spinner";

/**
 * Route guard that requires active authentication.
 * Redirects unauthenticated users to /login, preserving the intended destination in route state.
 */
export function ProtectedRoute() {
	const { isAuthenticated, isLoading } = useAuth();
	const location = useLocation();

	if (isLoading) {
		return (
			<div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
				<Spinner size="lg" className="text-teal-700" />
				<p className="text-xs font-medium text-slate-500 tracking-wide">
					Loading workspace...
				</p>
			</div>
		);
	}

	if (!isAuthenticated) {
		return <Navigate to="/login" replace state={{ from: location }} />;
	}

	return <Outlet />;
}
