import type { AuthUser } from "@emr/shared";
import type { UserDocument } from "../models/user.model";

/**
 * Maps a User document to the client-safe AuthUser shape.
 */
export function toAuthUser(user: UserDocument): AuthUser {
	return { id: user.id, name: user.name, email: user.email, role: user.role };
}
