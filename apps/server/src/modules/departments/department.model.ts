import mongoose, { type HydratedDocument, Schema } from "mongoose";

export interface IDepartment {
	name: string;
	nameNormalized: string;
	isActive: boolean;
	createdAt?: Date;
	updatedAt?: Date;
}

const departmentSchema = new Schema<IDepartment>(
	{
		name: { type: String, required: true, trim: true },
		nameNormalized: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true,
			index: true,
		},
		isActive: { type: Boolean, default: true },
	},
	{ timestamps: true },
);

export const Department = mongoose.model<IDepartment>(
	"Department",
	departmentSchema,
);

export type DepartmentDocument = HydratedDocument<IDepartment>;
