import type {
	AppointmentListQuery,
	AppointmentStatus,
	DoctorDto,
} from "@emr/shared";
import { RotateCcw, Search } from "lucide-react";
import { Button } from "../../../shared/components/ui/Button";
import { Input } from "../../../shared/components/ui/Input";
import { Select } from "../../../shared/components/ui/Select";

export interface AppointmentFiltersProps {
	filters: Partial<AppointmentListQuery>;
	onFiltersChange: (newFilters: Partial<AppointmentListQuery>) => void;
	doctors: DoctorDto[];
	isDoctorRole: boolean;
}

const STATUS_TABS: Array<{ label: string; value?: AppointmentStatus }> = [
	{ label: "All Appointments", value: undefined },
	{ label: "Scheduled", value: "SCHEDULED" },
	{ label: "Arrived", value: "ARRIVED" },
	{ label: "Completed", value: "COMPLETED" },
	{ label: "Cancelled", value: "CANCELLED" },
];

export function AppointmentFilters({
	filters,
	onFiltersChange,
	doctors,
	isDoctorRole,
}: AppointmentFiltersProps) {
	const departments = Array.from(
		new Set(doctors.map((d) => d.department)),
	).sort();

	const handleStatusTab = (status?: AppointmentStatus) => {
		onFiltersChange({ ...filters, status, page: 1 });
	};

	const handleReset = () => {
		onFiltersChange({
			page: 1,
			limit: 10,
			sortBy: "date",
			sortOrder: "desc",
			status: undefined,
			doctorId: undefined,
			department: undefined,
			mobile: undefined,
			dateFrom: undefined,
			dateTo: undefined,
		});
	};

	return (
		<div className="flex flex-col gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
			{/* Status Tabs */}
			<div className="flex items-center gap-1.5 border-b border-slate-100 pb-3 overflow-x-auto">
				{STATUS_TABS.map((tab) => {
					const isActive = filters.status === tab.value;
					return (
						<button
							key={tab.label}
							type="button"
							onClick={() => handleStatusTab(tab.value)}
							className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
								isActive
									? "bg-teal-700 text-white shadow-xs"
									: "bg-slate-100/70 text-slate-600 hover:bg-slate-200/70"
							}`}
						>
							{tab.label}
						</button>
					);
				})}
			</div>

			{/* Filter Controls Row */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
				{/* Mobile Search */}
				<Input
					label="Search by Patient Mobile"
					placeholder="Phone (min 3 digits, e.g. 987)"
					value={filters.mobile || ""}
					onChange={(e) => {
						const val = e.target.value.trim();
						onFiltersChange({
							...filters,
							mobile: val.length >= 3 ? val : undefined,
							page: 1,
						});
					}}
					leftIcon={<Search className="h-4 w-4" />}
				/>

				{/* Doctor Filter (Hidden for Doctor role who automatically only sees their own) */}
				{!isDoctorRole && (
					<Select
						label="Filter by Physician"
						value={filters.doctorId || ""}
						onChange={(e) =>
							onFiltersChange({
								...filters,
								doctorId: e.target.value || undefined,
								page: 1,
							})
						}
					>
						<option value="">All Physicians</option>
						{doctors.map((doc) => (
							<option key={doc.id} value={doc.id}>
								{doc.name} ({doc.department})
							</option>
						))}
					</Select>
				)}

				{/* Department Filter */}
				<Select
					label="Filter by Department"
					value={filters.department || ""}
					onChange={(e) =>
						onFiltersChange({
							...filters,
							department: e.target.value || undefined,
							page: 1,
						})
					}
				>
					<option value="">All Departments</option>
					{departments.map((dept) => (
						<option key={dept} value={dept}>
							{dept}
						</option>
					))}
				</Select>

				{/* Sort Options */}
				<div className="grid grid-cols-2 gap-2">
					<Select
						label="Sort By"
						value={filters.sortBy || "date"}
						onChange={(e) =>
							onFiltersChange({
								...filters,
								sortBy: e.target.value as AppointmentListQuery["sortBy"],
								page: 1,
							})
						}
					>
						<option value="date">Date</option>
						<option value="startTime">Time</option>
						<option value="createdAt">Created</option>
						<option value="patientName">Patient</option>
					</Select>

					<Select
						label="Order"
						value={filters.sortOrder || "desc"}
						onChange={(e) =>
							onFiltersChange({
								...filters,
								sortOrder: e.target.value as "asc" | "desc",
								page: 1,
							})
						}
					>
						<option value="desc">Descending</option>
						<option value="asc">Ascending</option>
					</Select>
				</div>
			</div>

			{/* Date Range Row */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
				<div className="flex flex-col sm:flex-row sm:items-center gap-2">
					<span className="text-xs font-semibold text-slate-700">
						Date Range:
					</span>
					<div className="flex items-center gap-2">
						<input
							type="date"
							value={filters.dateFrom || ""}
							onChange={(e) =>
								onFiltersChange({
									...filters,
									dateFrom: e.target.value || undefined,
									page: 1,
								})
							}
							className="w-full sm:w-auto rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-teal-600"
							aria-label="From date"
						/>
						<span className="text-xs text-slate-400">to</span>
						<input
							type="date"
							value={filters.dateTo || ""}
							onChange={(e) =>
								onFiltersChange({
									...filters,
									dateTo: e.target.value || undefined,
									page: 1,
								})
							}
							className="w-full sm:w-auto rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-teal-600"
							aria-label="To date"
						/>
					</div>
				</div>

				<Button
					variant="ghost"
					size="sm"
					onClick={handleReset}
					leftIcon={<RotateCcw className="h-3.5 w-3.5 text-slate-500" />}
					className="self-end sm:self-auto"
				>
					Reset Filters
				</Button>
			</div>
		</div>
	);
}
