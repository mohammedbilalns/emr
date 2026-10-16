import type { DoctorDto } from "@emr/shared";
import { Select } from "../../../shared/components/ui/Select";

export interface DoctorSelectorProps {
	doctors: DoctorDto[];
	selectedDepartment: string;
	selectedDoctorId: string;
	onDepartmentChange: (department: string) => void;
	onDoctorChange: (doctorId: string) => void;
	isLoading?: boolean;
}

export function DoctorSelector({
	doctors,
	selectedDepartment,
	selectedDoctorId,
	onDepartmentChange,
	onDoctorChange,
	isLoading = false,
}: DoctorSelectorProps) {
	// Extract unique departments
	const departments = Array.from(
		new Set(doctors.map((d) => d.department)),
	).sort();

	// Filter doctors by selected department if any
	const filteredDoctors = selectedDepartment
		? doctors.filter((d) => d.department === selectedDepartment)
		: doctors;

	const handleDepartmentSelect = (dept: string) => {
		onDepartmentChange(dept);
		if (dept) {
			const matching = doctors.filter((d) => d.department === dept);
			if (matching.length > 0) {
				onDoctorChange(matching[0].id);
			}
		}
	};

	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
			<Select
				label="Department"
				value={selectedDepartment}
				onChange={(e) => handleDepartmentSelect(e.target.value)}
				disabled={isLoading}
			>
				<option value="">All Departments</option>
				{departments.map((dept) => (
					<option key={dept} value={dept}>
						{dept}
					</option>
				))}
			</Select>

			<Select
				label="Doctor"
				value={selectedDoctorId}
				onChange={(e) => onDoctorChange(e.target.value)}
				disabled={isLoading || filteredDoctors.length === 0}
			>
				{filteredDoctors.length === 0 ? (
					<option value="">No doctors available</option>
				) : (
					filteredDoctors.map((doc) => (
						<option key={doc.id} value={doc.id}>
							{doc.name} · {doc.department} ({doc.schedule.slotDuration} min)
						</option>
					))
				)}
			</Select>
		</div>
	);
}
