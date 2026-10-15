import { ROLES, type Role } from "@emr/shared";
import bcrypt from "bcryptjs";
import mongoose, { type HydratedDocument, type Model, Schema } from "mongoose";

interface IUser {
	name: string;
	email: string;
	passwordHash: string;
	role: Role;
	isActive: boolean;
}

interface IUserMethods {
	comparePassword(candidate: string): Promise<boolean>;
}

type UserModel = Model<IUser, Record<string, never>, IUserMethods>;

const userSchema = new Schema<IUser, UserModel, IUserMethods>(
	{
		name: { type: String, required: true, trim: true },
		email: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true,
		},
		passwordHash: { type: String, required: true, select: false },
		role: { type: String, enum: [...ROLES], required: true },
		isActive: { type: Boolean, default: true },
	},
	{ timestamps: true },
);

userSchema.statics.hashPassword = (plain: string) => bcrypt.hash(plain, 12);

userSchema.methods.comparePassword = function (candidate: string) {
	return bcrypt.compare(candidate, this.passwordHash);
};

export const User = mongoose.model<IUser, UserModel>("User", userSchema);
export type UserDocument = HydratedDocument<IUser, IUserMethods>;
