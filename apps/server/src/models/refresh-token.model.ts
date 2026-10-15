import mongoose, { type HydratedDocument, Schema } from "mongoose";

export interface IRefreshToken {
	user: mongoose.Types.ObjectId;
	/** SHA-256 hash of the refresh token string */
	tokenHash: string;
	expiresAt: Date;
	revokedAt: Date | null;
}

const refreshTokenSchema = new Schema<IRefreshToken>(
	{
		user: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		tokenHash: { type: String, required: true, unique: true },
		expiresAt: { type: Date, required: true },
		revokedAt: { type: Date, default: null },
	},
	{ timestamps: true },
);

// TTL index: MongoDB automatically drops expired tokens after expiresAt
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshToken = mongoose.model<IRefreshToken>(
	"RefreshToken",
	refreshTokenSchema,
);

export type RefreshTokenDocument = HydratedDocument<IRefreshToken>;
