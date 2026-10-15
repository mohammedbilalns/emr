import { fromMinutes, type SlotDto, toMinutes } from "@emr/shared";
import { NotFoundError, ValidationError } from "../../errors/base.error";
import { Appointment } from "../appointments";
import { Doctor, type ISchedule, type ISession } from "../doctors";

export interface GeneratedSlot {
	startTime: string;
	endTime: string;
}

function localDateString(d: Date): string {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Generates discrete time slots for a doctor schedule on a given date, filtering breaks and past slots.
 */
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
				(b: ISession) =>
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

/**
 * Retrieves consultation slots for a doctor on a specific date, marked as AVAILABLE or BOOKED.
 */
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

	// Matches partial unique index { doctor, date, active: true } for a single index scan
	const booked = await Appointment.find({
		doctor: doctorId,
		date,
		active: true,
	})
		.select("startTime -_id")
		.lean();

	const bookedSet = new Set(
		booked.map((a: { startTime: string }) => a.startTime),
	);

	return generated.map((s) => ({
		startTime: s.startTime,
		endTime: s.endTime,
		status: bookedSet.has(s.startTime) ? "BOOKED" : "AVAILABLE",
	}));
}
