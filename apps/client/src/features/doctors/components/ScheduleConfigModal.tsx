import {
	type DoctorDto,
	type SessionDto,
	updateDoctorScheduleSchema,
} from "@emr/shared";
import { Plus, Trash2 } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { Button } from "../../../shared/components/ui/Button";
import { Modal } from "../../../shared/components/ui/Modal";
import { Select } from "../../../shared/components/ui/Select";

interface IdentifiedSession extends SessionDto {
	id: string;
}

export interface ScheduleConfigModalProps {
	doctor: DoctorDto | null;
	isOpen: boolean;
	onClose: () => void;
	onSave: (
		id: string,
		schedule: {
			workingDays: number[];
			sessions: SessionDto[];
			breaks: SessionDto[];
			slotDuration: number;
		},
	) => void;
	isLoading?: boolean;
}

const DAYS = [
	{ label: "Mon", value: 1 },
	{ label: "Tue", value: 2 },
	{ label: "Wed", value: 3 },
	{ label: "Thu", value: 4 },
	{ label: "Fri", value: 5 },
	{ label: "Sat", value: 6 },
	{ label: "Sun", value: 0 },
];

export function ScheduleConfigModal({
	doctor,
	isOpen,
	onClose,
	onSave,
	isLoading = false,
}: ScheduleConfigModalProps) {
	const [workingDays, setWorkingDays] = useState<number[]>([1, 2, 3, 4, 5]);
	const [sessions, setSessions] = useState<IdentifiedSession[]>([]);
	const [breaks, setBreaks] = useState<IdentifiedSession[]>([]);
	const [slotDuration, setSlotDuration] = useState<number>(15);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	useEffect(() => {
		if (doctor) {
			setWorkingDays(doctor.schedule.workingDays);
			setSessions(
				doctor.schedule.sessions.map((s) => ({
					...s,
					id: `${s.start}-${s.end}-${Math.random().toString(36).substring(2, 7)}`,
				})),
			);
			setBreaks(
				doctor.schedule.breaks.map((b) => ({
					...b,
					id: `${b.start}-${b.end}-${Math.random().toString(36).substring(2, 7)}`,
				})),
			);
			setSlotDuration(doctor.schedule.slotDuration);
			setErrorMessage(null);
		}
	}, [doctor]);

	if (!doctor) return null;

	const toggleDay = (day: number) => {
		if (workingDays.includes(day)) {
			if (workingDays.length === 1) return; // Keep at least one day
			setWorkingDays(workingDays.filter((d) => d !== day));
		} else {
			setWorkingDays([...workingDays, day].sort());
		}
	};

	const addSession = () => {
		setSessions([
			...sessions,
			{
				id: `session-new-${Date.now()}`,
				start: "17:00",
				end: "19:00",
			},
		]);
	};

	const removeSession = (id: string) => {
		if (sessions.length <= 1) return;
		setSessions(sessions.filter((s) => s.id !== id));
	};

	const updateSession = (id: string, field: "start" | "end", val: string) => {
		setSessions(
			sessions.map((s) => (s.id === id ? { ...s, [field]: val } : s)),
		);
	};

	const addBreak = () => {
		setBreaks([
			...breaks,
			{
				id: `break-new-${Date.now()}`,
				start: "12:00",
				end: "13:00",
			},
		]);
	};

	const removeBreak = (id: string) => {
		setBreaks(breaks.filter((b) => b.id !== id));
	};

	const updateBreak = (id: string, field: "start" | "end", val: string) => {
		setBreaks(breaks.map((b) => (b.id === id ? { ...b, [field]: val } : b)));
	};

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();
		setErrorMessage(null);

		const candidate = {
			schedule: {
				workingDays,
				sessions: sessions.map(({ start, end }) => ({ start, end })),
				breaks: breaks.map(({ start, end }) => ({ start, end })),
				slotDuration: Number(slotDuration),
			},
		};

		const result = updateDoctorScheduleSchema.safeParse(candidate);
		if (!result.success) {
			setErrorMessage(result.error.issues[0].message);
			return;
		}

		onSave(doctor.id, result.data.schedule);
		onClose();
	};

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title={`Configure Schedule · ${doctor.name}`}
			description={`Department: ${doctor.department}`}
			maxWidth="lg"
			footer={
				<div className="flex items-center justify-end gap-2 w-full">
					<Button
						variant="outline"
						size="sm"
						onClick={onClose}
						disabled={isLoading}
					>
						Cancel
					</Button>
					<Button
						variant="primary"
						size="sm"
						onClick={handleSubmit}
						isLoading={isLoading}
					>
						Save Physician Schedule
					</Button>
				</div>
			}
		>
			<form onSubmit={handleSubmit} className="flex flex-col gap-5 text-xs">
				{errorMessage && (
					<div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl font-medium">
						{errorMessage}
					</div>
				)}

				{/* Working Days */}
				<div className="flex flex-col gap-2">
					<span className="font-semibold text-slate-800">
						Weekly Working Days
					</span>
					<div className="flex flex-wrap gap-2">
						{DAYS.map((day) => {
							const isSelected = workingDays.includes(day.value);
							return (
								<button
									key={day.value}
									type="button"
									onClick={() => toggleDay(day.value)}
									className={`px-3 py-1.5 rounded-lg border font-semibold transition-all cursor-pointer ${
										isSelected
											? "bg-teal-700 text-white border-teal-700 shadow-xs"
											: "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
									}`}
								>
									{day.label}
								</button>
							);
						})}
					</div>
				</div>

				{/* Slot Duration */}
				<div className="flex flex-col gap-1.5 max-w-xs">
					<Select
						label="Slot Duration (Minutes)"
						value={slotDuration}
						onChange={(e) => setSlotDuration(Number(e.target.value))}
					>
						<option value={10}>10 Minutes</option>
						<option value={15}>15 Minutes (Standard)</option>
						<option value={20}>20 Minutes</option>
						<option value={30}>30 Minutes</option>
						<option value={45}>45 Minutes</option>
						<option value={60}>60 Minutes</option>
					</Select>
				</div>

				{/* Working Sessions */}
				<div className="flex flex-col gap-2">
					<div className="flex items-center justify-between">
						<span className="font-semibold text-slate-800">
							Working Sessions (Time Spans)
						</span>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={addSession}
							leftIcon={<Plus className="h-3.5 w-3.5" />}
						>
							Add Session
						</Button>
					</div>

					<div className="flex flex-col gap-2">
						{sessions.map((session) => (
							<div
								key={session.id}
								className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60"
							>
								<div className="flex items-center gap-2 flex-1 min-w-0">
									<input
										type="time"
										value={session.start}
										onChange={(e) =>
											updateSession(session.id, "start", e.target.value)
										}
										className="w-full min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800 font-mono"
									/>
									<span className="text-slate-400 shrink-0">to</span>
									<input
										type="time"
										value={session.end}
										onChange={(e) =>
											updateSession(session.id, "end", e.target.value)
										}
										className="w-full min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800 font-mono"
									/>
								</div>
								{sessions.length > 1 && (
									<button
										type="button"
										onClick={() => removeSession(session.id)}
										className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors shrink-0"
										title="Remove session"
									>
										<Trash2 className="h-3.5 w-3.5" />
									</button>
								)}
							</div>
						))}
					</div>
				</div>

				{/* Scheduled Breaks */}
				<div className="flex flex-col gap-2">
					<div className="flex items-center justify-between">
						<span className="font-semibold text-slate-800">
							Breaks & Lunch Intervals
						</span>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={addBreak}
							leftIcon={<Plus className="h-3.5 w-3.5" />}
						>
							Add Break
						</Button>
					</div>

					{breaks.length === 0 ? (
						<p className="text-slate-400 italic">
							No breaks configured (continuous sessions).
						</p>
					) : (
						<div className="flex flex-col gap-2">
							{breaks.map((b) => (
								<div
									key={b.id}
									className="flex items-center gap-2 bg-amber-50/50 p-2.5 rounded-xl border border-amber-200/60"
								>
									<div className="flex items-center gap-2 flex-1 min-w-0">
										<input
											type="time"
											value={b.start}
											onChange={(e) =>
												updateBreak(b.id, "start", e.target.value)
											}
											className="w-full min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800 font-mono"
										/>
										<span className="text-slate-400 shrink-0">to</span>
										<input
											type="time"
											value={b.end}
											onChange={(e) => updateBreak(b.id, "end", e.target.value)}
											className="w-full min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800 font-mono"
										/>
									</div>
									<button
										type="button"
										onClick={() => removeBreak(b.id)}
										className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors shrink-0"
										title="Remove break"
									>
										<Trash2 className="h-3.5 w-3.5" />
									</button>
								</div>
							))}
						</div>
					)}
				</div>
			</form>
		</Modal>
	);
}
