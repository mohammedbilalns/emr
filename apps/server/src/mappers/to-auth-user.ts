import type { AuthUser } from "@emr/shared";
import type { UserDocument } from "../models/user.model";

// ---------------------------------------------------------------------------
// Maps a Mongoose UserDocument to the internal AuthUser shape used by the
// API layer.  Only the fields needed by the frontend are exposed.
// ---------------------------------------------------------------------------
export function toAuthUser(user: UserDocument): AuthUser {
	return { id: user.id, name: user.name, email: user.email, role: user.role };
}
