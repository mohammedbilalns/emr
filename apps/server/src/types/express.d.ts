import type { AuthUser } from "@emr/shared";

/**
 * Module augmentation extending the Express Request interface
 * with authenticated user context and validated payload data.
 */
declare module "express-serve-static-core" {
	interface Request {
		/** Populated by authentication middleware on protected routes */
		user?: AuthUser;

		/** Sanitized and parsed data populated by validation middleware */
		validated?: {
			body?: unknown;
			params?: unknown;
			query?: unknown;
		};
	}
}
