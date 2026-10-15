import mongoose, { type HydratedDocument, Schema } from "mongoose";

export interface ISession {
	start: string;
	end: string;
}

export interface ISchedule {
	workingDays: number[]; // 0=Sun … 6=Sat
	sessions: ISession[]; // multiple per day, non-overlapping
	breaks: ISession[]; // no slots generated during these
	slotDuration: number; // minutes
}

interface IDoctor {
	user: mongoose.Types.ObjectId;
	name: string;
	department: string;
	schedule: ISchedule;
	isActive: boolean;
}

const sessionSchema = new Schema<ISession>(
	{
		start: { type: String, required: true },
		end: { type: String, required: true },
	},
	{ _id: false },
);

const doctorSchema = new Schema<IDoctor>(
	{
		user: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
			unique: true,
		},
		name: { type: String, required: true, trim: true },
		department: { type: String, required: true, trim: true, index: true },
		schedule: {
			workingDays: { type: [Number], required: true },
			sessions: { type: [sessionSchema], required: true },
			breaks: { type: [sessionSchema], default: [] },
			slotDuration: { type: Number, required: true, min: 5, max: 60 },
		},
		isActive: { type: Boolean, default: true },
	},
	{ timestamps: true },
);

export const Doctor = mongoose.model<IDoctor>("Doctor", doctorSchema);
export type DoctorDocument = HydratedDocument<IDoctor>;
