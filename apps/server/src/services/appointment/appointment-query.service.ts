import type {
	AppointmentDto,
	AppointmentListQuery,
	AuthUser,
} from "@emr/shared";
import { NotFoundError } from "../../errors/base.error";
import { toAppointmentDto } from "../../mappers/appointment.mapper";
import { Appointment } from "../../models/appointment.model";
import { Doctor } from "../../models/doctor.model";
import { escapeRegex } from "../../utils/regex";

export interface ListResult {
	items: AppointmentDto[];
	total: number;
	page: number;
	limit: number;
}

/**
 * Lists appointments matching search filters with role-based scoping and pagination.
 */
export async function listAppointments(
	query: AppointmentListQuery,
	actor: AuthUser,
): Promise<ListResult> {
	const filter: Record<string, unknown> = {};

	if (actor.role === "DOCTOR") {
		// Scope doctor queries strictly to their own profile rather than user-supplied parameters
		const doctor = await Doctor.findOne({ user: actor.id });
		if (!doctor) {
			return { items: [], total: 0, page: query.page, limit: query.limit };
		}
		filter.doctor = doctor._id;
	} else {
		if (query.doctorId) filter.doctor = query.doctorId;
		if (query.patientId) filter.patient = query.patientId;
	}

	if (query.department) filter.department = query.department;
	if (query.status) filter.status = query.status;
	if (query.mobile) {
		filter.patientMobile = new RegExp(`^${escapeRegex(query.mobile)}`);
	}
	if (query.dateFrom || query.dateTo) {
		// ISO 'YYYY-MM-DD' dates sort lexicographically, allowing direct string range comparisons
		filter.date = {
			...(query.dateFrom && { $gte: query.dateFrom }),
			...(query.dateTo && { $lte: query.dateTo }),
		};
	}

	const dir = query.sortOrder === "asc" ? 1 : -1;
	// Include _id as a secondary sort key to ensure deterministic pagination order
	const sort: Record<string, 1 | -1> = { [query.sortBy]: dir, _id: dir };

	const [docs, total] = await Promise.all([
		Appointment.find(filter)
			.sort(sort)
			.skip((query.page - 1) * query.limit)
			.limit(query.limit),
		Appointment.countDocuments(filter),
	]);

	return {
		items: docs.map(toAppointmentDto),
		total,
		page: query.page,
		limit: query.limit,
	};
}

/**
 * Retrieves an appointment by ID with role-based access checks.
 */
export async function getAppointment(
	id: string,
	actor: AuthUser,
): Promise<AppointmentDto> {
	const appointment = await Appointment.findById(id);
	if (!appointment) throw new NotFoundError("Appointment not found");
	if (actor.role === "DOCTOR") {
		const doctor = await Doctor.findOne({ user: actor.id });
		if (!doctor || String(appointment.doctor) !== doctor.id) {
			throw new NotFoundError("Appointment not found");
		}
	}
	return toAppointmentDto(appointment);
}
