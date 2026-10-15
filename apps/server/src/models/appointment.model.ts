import { APPOINTMENT_STATUS, type AppointmentStatus } from "@emr/shared";
import mongoose, { type HydratedDocument, Schema } from "mongoose";

interface IAppointment {
	doctor: mongoose.Types.ObjectId;
	doctorName: string;
	patient: mongoose.Types.ObjectId;
	patientCode: string;
	patientName: string;
	patientMobile: string;
	department: string;
	date: string; // "YYYY-MM-DD"
	startTime: string; // "HH:mm"
	endTime: string; // "HH:mm"
	status: AppointmentStatus;
	purpose?: string;
	notes?: string;
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

// ──  double-booking guard ──────────────────────────────────────────────
// Partial unique index: at most ONE active appointment per doctor/date/slot.
// Cancellation sets active:false → the doc exits the index → slot is rebookable.
appointmentSchema.index(
	{ doctor: 1, date: 1, startTime: 1 },
	{ unique: true, partialFilterExpression: { active: true } },
);

// List endpoint access paths
appointmentSchema.index({ date: -1, status: 1 });
appointmentSchema.index({ department: 1, date: -1 });
appointmentSchema.index({ patient: 1, date: -1 });

export const Appointment = mongoose.model<IAppointment>(
	"Appointment",
	appointmentSchema,
);
export type AppointmentDocument = HydratedDocument<IAppointment>;
