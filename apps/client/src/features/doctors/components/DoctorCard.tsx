import type { DoctorDto } from "@emr/shared";
import {
	Calendar,
	Clock,
	Coffee,
	Edit3,
	Pencil,
	Stethoscope,
} from "lucide-react";
import { Badge } from "../../../shared/components/ui/Badge";
import { Button } from "../../../shared/components/ui/Button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "../../../shared/components/ui/Card";

export interface DoctorCardProps {
	doctor: DoctorDto;
	onEditDoctor?: (doctor: DoctorDto) => void;
	onEditSchedule: (doctor: DoctorDto) => void;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function DoctorCard({
	doctor,
	onEditDoctor,
	onEditSchedule,
}: DoctorCardProps) {
	const workingDaysFormatted = doctor.schedule.workingDays
		.map((dayIdx) => DAY_NAMES[dayIdx])
		.join(", ");

	return (
		<Card
			data-testid="doctor-card"
			className="flex flex-col justify-between hover:border-slate-300 transition-all"
		>
			<div>
				<CardHeader className="pb-3">
					<div className="flex flex-wrap sm:flex-nowrap items-start justify-between gap-2">
						<div className="flex items-center gap-2.5">
							<div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
								<Stethoscope className="h-5 w-5" />
							</div>
							<div>
								<CardTitle className="text-sm font-semibold text-slate-900">
									{doctor.name}
								</CardTitle>
								<span className="text-xs text-slate-500">
									{doctor.department}
								</span>
							</div>
						</div>
						<Badge variant="info" size="sm">
							{doctor.schedule.slotDuration} min consultations
						</Badge>
					</div>
				</CardHeader>

				<CardContent className="flex flex-col gap-3 text-xs pt-1">
					{/* Working Days */}
					<div className="flex items-start gap-2 text-slate-600">
						<Calendar className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
						<div className="flex flex-col">
							<span className="font-semibold text-slate-700 text-[11px]">
								Working Days:
							</span>
							<span className="text-slate-600">{workingDaysFormatted}</span>
						</div>
					</div>

					{/* Working Sessions */}
					<div className="flex items-start gap-2 text-slate-600">
						<Clock className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
						<div className="flex flex-col">
							<span className="font-semibold text-slate-700 text-[11px]">
								Daily Sessions:
							</span>
							<div className="flex flex-wrap gap-1 mt-0.5">
								{doctor.schedule.sessions.map((session) => (
									<span
										key={`${session.start}-${session.end}`}
										className="font-mono bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[11px] border border-slate-200"
									>
										{session.start} – {session.end}
									</span>
								))}
							</div>
						</div>
					</div>

					{/* Breaks */}
					{doctor.schedule.breaks.length > 0 && (
						<div className="flex items-start gap-2 text-slate-600">
							<Coffee className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
							<div className="flex flex-col">
								<span className="font-semibold text-slate-700 text-[11px]">
									Scheduled Breaks:
								</span>
								<div className="flex flex-wrap gap-1 mt-0.5">
									{doctor.schedule.breaks.map((b) => (
										<span
											key={`${b.start}-${b.end}`}
											className="font-mono bg-amber-50 text-amber-800 px-2 py-0.5 rounded text-[11px] border border-amber-200"
										>
											{b.start} – {b.end}
										</span>
									))}
								</div>
							</div>
						</div>
					)}
				</CardContent>
			</div>

			<CardFooter className="pt-3 flex items-center gap-2">
				{onEditDoctor && (
					<Button
						variant="outline"
						size="sm"
						className="flex-1 text-xs font-semibold"
						onClick={() => onEditDoctor(doctor)}
						leftIcon={<Pencil className="h-3.5 w-3.5 text-slate-500" />}
					>
						Edit Doctor
					</Button>
				)}
				<Button
					variant="outline"
					size="sm"
					className={
						onEditDoctor
							? "flex-1 text-xs font-semibold"
							: "w-full text-xs font-semibold"
					}
					onClick={() => onEditSchedule(doctor)}
					leftIcon={<Edit3 className="h-3.5 w-3.5 text-slate-500" />}
				>
					Configure Schedule
				</Button>
			</CardFooter>
		</Card>
	);
}
