import { APPOINTMENT_STATUS, type AppointmentStatus } from "@emr/shared";
import mongoose, { type HydratedDocument, Schema } from "mongoose";

export interface IAppointment {
	doctor: mongoose.Types.ObjectId;
	/** Denormalized for fast listings without $lookup */
	doctorName: string;
	patient: mongoose.Types.ObjectId;
	patientCode: string;
	/** Denormalized for fast listings without $lookup */
	patientName: string;
	/** Denormalized for fast listings without $lookup */
	patientMobile: string;
	department: string;
	/** Calendar date in ISO format ('YYYY-MM-DD') */
	date: string;
	/** Slot start time formatted as 'HH:mm' */
	startTime: string;
	/** Slot end time formatted as 'HH:mm' */
	endTime: string;
	status: AppointmentStatus;
	purpose?: string;
	notes?: string;
	/** Set to false on cancellation to release slot in partial unique index */
	active: boolean;
	createdBy: mongoose.Types.ObjectId;
	updatedBy?: mongoose.Types.ObjectId;
}

const appointmentSchema = new Schema<IAppointment>(
	{
		doctor: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
		doctorName: { type: String, required: true },
		patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
		patientCode: { type: String, required: true },
		patientName: { type: String, required: true },
		patientMobile: { type: String, required: true, index: true },
		department: { type: String, required: true },
		date: { type: String, required: true },
		startTime: { type: String, required: true },
		endTime: { type: String, required: true },
		status: {
			type: String,
			enum: [...APPOINTMENT_STATUS],
			default: "SCHEDULED",
		},
		purpose: { type: String, trim: true },
		notes: { type: String, trim: true },
		active: { type: Boolean, default: true, required: true },
		createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
		updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
	},
	{ timestamps: true },
);

// Double-booking guard: at most ONE active appointment per doctor/date/slot.
// Cancellation sets active:false, which drops the doc from the partial index and releases the slot.
appointmentSchema.index(
	{ doctor: 1, date: 1, startTime: 1 },
	{ unique: true, partialFilterExpression: { active: true } },
);

// Access paths for list filters
appointmentSchema.index({ date: -1, status: 1 });
appointmentSchema.index({ department: 1, date: -1 });
appointmentSchema.index({ patient: 1, date: -1 });

export const Appointment = mongoose.model<IAppointment>(
	"Appointment",
	appointmentSchema,
);

export type AppointmentDocument = HydratedDocument<IAppointment>;
