import { fromMinutes, type SlotDto, toMinutes } from "@emr/shared";
import { NotFoundError, ValidationError } from "../errors/base.error";
import { Appointment } from "../models/appointment.model";
import { Doctor, type ISchedule } from "../models/doctor.model";

export interface GeneratedSlot {
	startTime: string;
	endTime: string;
}

function localDateString(d: Date): string {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function generateSlots(
	schedule: ISchedule,
	date: string,
	now: Date = new Date(),
): GeneratedSlot[] {
	const [y, m, d] = date.split("-").map(Number);
	const dayOfWeek = new Date(y, m - 1, d).getDay();
	if (!schedule.workingDays.includes(dayOfWeek)) return [];

	const slots: GeneratedSlot[] = [];
	for (const session of schedule.sessions) {
		const start = toMinutes(session.start);
		const end = toMinutes(session.end);
		for (
			let t = start;
			t + schedule.slotDuration <= end;
			t += schedule.slotDuration
		) {
			// slot [t, t+duration) must not overlap any break
			const overlapsBreak = schedule.breaks.some(
				(b) =>
					toMinutes(b.start) < t + schedule.slotDuration &&
					t < toMinutes(b.end),
			);
			if (!overlapsBreak) {
				slots.push({
					startTime: fromMinutes(t),
					endTime: fromMinutes(t + schedule.slotDuration),
				});
			}
		}
	}

	const today = localDateString(now);
	if (date < today) return [];
	if (date === today) {
		const nowMinutes = now.getHours() * 60 + now.getMinutes();
		return slots.filter((s) => toMinutes(s.startTime) > nowMinutes);
	}
	return slots;
}

export async function getSlots(
	doctorId: string,
	date: string,
): Promise<SlotDto[]> {
	const today = localDateString(new Date());
	if (date < today) {
		throw new ValidationError("Cannot retrieve slots for a past date");
	}

	const doctor = await Doctor.findOne({ _id: doctorId, isActive: true });
	if (!doctor) throw new NotFoundError("Doctor not found");

	const generated = generateSlots(doctor.schedule, date);

	// One indexed query — { doctor, date, active } matches the partial unique index fields,
	// so booked-slot lookup is a single index scan. No $lookup, no populated patients.
	const booked = await Appointment.find({
		doctor: doctorId,
		date,
		active: true,
	})
		.select("startTime")
		.lean();
	const bookedMap = new Map(booked.map((a) => [a.startTime, String(a._id)]));

	return generated.map((s) => {
		const appointmentId = bookedMap.get(s.startTime);
		return {
			startTime: s.startTime,
			endTime: s.endTime,
			status: appointmentId ? "BOOKED" : "AVAILABLE",
			...(appointmentId && { appointmentId }),
		};
	});
}
