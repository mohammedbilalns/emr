import type { CreateStaffBody, StaffDto } from "@emr/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, RefreshCw, ShieldCheck, UserCheck, Users } from "lucide-react";
import { useState } from "react";
import { getErrorMessage } from "../../../shared/api/api-errors";
import { Badge } from "../../../shared/components/ui/Badge";
import { Button } from "../../../shared/components/ui/Button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "../../../shared/components/ui/Card";
import { Spinner } from "../../../shared/components/ui/Spinner";
import { useToast } from "../../../shared/hooks/use-toast";
import { createReceptionistApi, listStaffApi } from "../api/staff.api";
import { CreateStaffModal } from "../components/CreateStaffModal";

export function StaffPage() {
	const queryClient = useQueryClient();
	const toast = useToast();
	const [isCreateOpen, setIsCreateOpen] = useState(false);

	const {
		data: staff = [],
		isLoading,
		isFetching,
		refetch,
	} = useQuery<StaffDto[]>({
		queryKey: ["staff"],
		queryFn: listStaffApi,
	});

	const createMutation = useMutation({
		mutationFn: (body: CreateStaffBody) => createReceptionistApi(body),
		onSuccess: (data) => {
			toast.success(
				`${data.name} (${data.email}) created as Receptionist`,
				"Staff Member Created",
			);
			void queryClient.invalidateQueries({ queryKey: ["staff"] });
		},
		onError: (error) => {
			toast.error(
				getErrorMessage(error, "Failed to register staff"),
				"Registration Error",
			);
		},
	});

	return (
		<div className="flex flex-col gap-6">
			{/* Page Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
						<Users className="h-6 w-6 text-teal-700" />
						<span>Reception Staff</span>
					</h1>
					<p className="text-xs text-slate-500 mt-0.5">
						Manage clinic receptionists and front-desk team members.
					</p>
				</div>

				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => void refetch()}
						disabled={isFetching}
						leftIcon={
							<RefreshCw
								className={`h-3.5 w-3.5 ${isFetching ? "animate-spin text-teal-700" : ""}`}
							/>
						}
					>
						Refresh
					</Button>

					<Button
						variant="primary"
						size="sm"
						onClick={() => setIsCreateOpen(true)}
						leftIcon={<Plus className="h-4 w-4" />}
					>
						Add Receptionist
					</Button>
				</div>
			</div>

			{/* Role Privileges Info Banner */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<Card>
					<CardHeader className="pb-2">
						<div className="flex items-center gap-2">
							<ShieldCheck className="h-4 w-4 text-purple-700" />
							<CardTitle className="text-sm">Administrator Role</CardTitle>
						</div>
					</CardHeader>
					<CardContent className="text-xs text-slate-600 space-y-1.5 pt-0">
						<p>• Add and manage doctors and clinical departments</p>
						<p>• Set consultation hours, session times, and breaks</p>
						<p>• Onboard and manage front-desk reception staff</p>
						<p>• View clinic-wide activity and appointment records</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<div className="flex items-center gap-2">
							<UserCheck className="h-4 w-4 text-teal-700" />
							<CardTitle className="text-sm">Receptionist Role</CardTitle>
						</div>
					</CardHeader>
					<CardContent className="text-xs text-slate-600 space-y-1.5 pt-0">
						<p>• Search registered patient records by name, ID, or phone</p>
						<p>
							• Register walk-in and new patients during appointment booking
						</p>
						<p>• Schedule patient consultations with available doctors</p>
						<p>• Check patients in on arrival and manage cancellations</p>
					</CardContent>
				</Card>
			</div>

			{/* Staff Directory Table Card */}
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="text-sm font-semibold">
						Active Front-Desk Receptionists
					</CardTitle>
				</CardHeader>
				<CardContent className="p-0">
					{isLoading ? (
						<div className="flex flex-col items-center justify-center p-12 gap-3 min-h-[160px]">
							<Spinner size="md" className="text-teal-700" />
							<span className="text-xs font-medium text-slate-500">
								Loading staff directory...
							</span>
						</div>
					) : staff.length === 0 ? (
						<div className="p-8 text-center text-xs text-slate-500">
							No staff members found.
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-left border-collapse text-xs">
								<thead>
									<tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
										<th className="px-4 py-3">Staff Name</th>
										<th className="px-4 py-3">Email</th>
										<th className="px-4 py-3">Role</th>
										<th className="px-4 py-3">Status</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100">
									{staff.map((member) => (
										<tr key={member.id} className="hover:bg-slate-50/50">
											<td className="px-4 py-3 font-semibold text-slate-900">
												{member.name}
											</td>
											<td className="px-4 py-3 font-mono text-slate-600">
												{member.email}
											</td>
											<td className="px-4 py-3">
												<Badge variant="success" size="sm" dot>
													{member.role}
												</Badge>
											</td>
											<td className="px-4 py-3">
												<span
													className={`text-[11px] font-medium ${
														member.isActive
															? "text-emerald-700"
															: "text-slate-400"
													}`}
												>
													{member.isActive ? "Active" : "Inactive"}
												</span>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Create Staff Modal */}
			<CreateStaffModal
				isOpen={isCreateOpen}
				onClose={() => {
					setIsCreateOpen(false);
					createMutation.reset();
				}}
				onCreate={(body) => {
					createMutation.mutate(body, {
						onSuccess: () => {
							setIsCreateOpen(false);
							createMutation.reset();
						},
					});
				}}
				isLoading={createMutation.isPending}
				error={createMutation.error}
			/>
		</div>
	);
}
