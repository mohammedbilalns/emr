import type { Role } from "@emr/shared";
import type { AuditAction } from "../../config/constants";
import logger from "../../logging/logger";
import { AuditLog } from "./audit-log.model";

export interface AuditEntry {
	userId?: string | null;
	role: Role | "SYSTEM";
	action: AuditAction;
	entity: string;
	entityId?: string;
	details?: Record<string, unknown>;
}

/**
 * Persists an audit log document. Swallows and logs write failures so
 * non-critical audit errors do not disrupt the primary request lifecycle.
 */
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
		logger.error({ error, action: entry.action }, "Audit write failed");
	}
}
