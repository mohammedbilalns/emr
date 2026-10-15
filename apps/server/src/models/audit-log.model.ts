import mongoose, { type HydratedDocument, Schema } from "mongoose";
import type { AuditAction } from "../config/constants";

interface IAuditLog {
	user: mongoose.Types.ObjectId | null; // null = system action
	role: string;
	action: AuditAction;
	entity: string;
	entityId?: string;
	details?: Record<string, unknown>;
	timestamp: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
	{
		user: { type: Schema.Types.ObjectId, ref: "User", default: null },
		role: { type: String, required: true },
		action: { type: String, required: true },
		entity: { type: String, required: true },
		entityId: { type: String },
		details: { type: Schema.Types.Mixed },
		timestamp: { type: Date, default: Date.now, required: true },
	},
	{ timestamps: false, capped: false },
);

auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ user: 1, timestamp: -1 });
auditLogSchema.index({ entity: 1, entityId: 1, timestamp: -1 });

export const AuditLog = mongoose.model<IAuditLog>("AuditLog", auditLogSchema);
export type AuditLogDocument = HydratedDocument<IAuditLog>;
