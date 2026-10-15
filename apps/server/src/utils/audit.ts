import type { Role } from "@emr/shared";
import type { AuditAction } from "../config/constants";
import logger from "../logging/logger";
import { AuditLog } from "../models/audit-log.model";

// ---------------------------------------------------------------------------
// Audit logging utility.
// ---------------------------------------------------------------------------

interface AuditEntry {
	// Identifier of the user who triggered the action (may be null for system events)
	userId?: string | null;
	// Role of the actor: either a real user role or "SYSTEM" for automated actions
	role: Role | "SYSTEM";
	// The action that was performed (e.g., LOGIN, LOGOUT, TOKEN_REFRESHED)
	action: AuditAction;
	// Name of the entity affected (e.g., "User", "Appointment", "Doctor")
	entity: string;
	// Identifier of the specific entity instance (optional)
	entityId?: string;
	// Additional key-value details (e.g., email, IP, error codes)
	details?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Logs an audit entry by creating an AuditLog document in the database.
// ---------------------------------------------------------------------------
export async function audit(entry: AuditEntry): Promise<void> {
	try {
		await AuditLog.create({
			user: entry.userId ?? null,
			role: entry.role,
			action: entry.action,
			entity: entry.entity,
			entityId: entry.entityId,
			details: entry.details,
			timestamp: new Date(),
		});
	} catch (error) {
		// Log the failure so operators know audit writing did not succeed,
		logger.error({ error, action: entry.action }, "Audit write failed");
	}
}
