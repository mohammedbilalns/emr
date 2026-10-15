import mongoose, { type HydratedDocument, Schema } from "mongoose";

const GENDERS = ["MALE", "FEMALE", "OTHER"] as const;

export interface IPatient {
	/** Sequential identifier (e.g., 'P000001') */
	patientCode: string;
	name: string;
	mobile: string;
	gender: (typeof GENDERS)[number];
	/** ISO date string ('YYYY-MM-DD') */
	dateOfBirth?: string;
}

const patientSchema = new Schema<IPatient>(
	{
		patientCode: { type: String, required: true, unique: true },
		name: { type: String, required: true, trim: true, index: true },
		mobile: { type: String, required: true, unique: true, index: true },
		gender: { type: String, enum: [...GENDERS], required: true },
		dateOfBirth: { type: String },
	},
	{ timestamps: true },
);

export const Patient = mongoose.model<IPatient>("Patient", patientSchema);

export type PatientDocument = HydratedDocument<IPatient>;
