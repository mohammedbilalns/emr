import { Navigate, Route, Routes } from "react-router-dom";
import { AppointmentsPage } from "../features/appointments/pages/AppointmentsPage";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { DashboardPage } from "../features/dashboard/pages/DashboardPage";
import { DoctorsPage } from "../features/doctors/pages/DoctorsPage";
import { SchedulerPage } from "../features/scheduler/pages/SchedulerPage";
import { StaffPage } from "../features/staff/pages/StaffPage";
import { AppLayout } from "../shared/components/layout/AppLayout";
import { GuestRoute } from "../shared/components/layout/GuestRoute";
import { ProtectedRoute } from "../shared/components/layout/ProtectedRoute";
import { RoleGuard } from "../shared/components/layout/RoleGuard";

export function AppRoutes() {
	return (
		<Routes>
			{/* Public / Guest-Only Authentication Route */}
			<Route element={<GuestRoute />}>
				<Route path="/login" element={<LoginPage />} />
			</Route>

			{/* Protected Authenticated Routes */}
			<Route element={<ProtectedRoute />}>
				<Route element={<AppLayout />}>
					<Route path="/" element={<Navigate to="/dashboard" replace />} />
					<Route path="/dashboard" element={<DashboardPage />} />
					<Route path="/appointments" element={<AppointmentsPage />} />

					{/* Scheduler: Super Admin & Receptionist only */}
					<Route
						path="/scheduler"
						element={
							<RoleGuard allowedRoles={["SUPER_ADMIN", "RECEPTIONIST"]}>
								<SchedulerPage />
							</RoleGuard>
						}
					/>

					{/* Doctors: Super Admin only */}
					<Route
						path="/doctors"
						element={
							<RoleGuard allowedRoles={["SUPER_ADMIN"]}>
								<DoctorsPage />
							</RoleGuard>
						}
					/>

					{/* Staff: Super Admin only */}
					<Route
						path="/staff"
						element={
							<RoleGuard allowedRoles={["SUPER_ADMIN"]}>
								<StaffPage />
							</RoleGuard>
						}
					/>
				</Route>
			</Route>

			{/* Catch-all redirect */}
			<Route path="*" element={<Navigate to="/dashboard" replace />} />
		</Routes>
	);
}
