import bcrypt from "bcryptjs";

const DEFAULT_SALT_ROUNDS = 12;

/**
 * Pre-computed dummy hash used to neutralize timing attacks when
 * a queried user does not exist in the database.
 */
export const DUMMY_HASH = bcrypt.hashSync(
	"timing-equalizer",
	DEFAULT_SALT_ROUNDS,
);

/**
 * Hashes a plain-text password using bcrypt.
 */
export async function hashPassword(
	plain: string,
	saltRounds: number = DEFAULT_SALT_ROUNDS,
): Promise<string> {
	return bcrypt.hash(plain, saltRounds);
}

/**
 * Compares a plain-text candidate password against a bcrypt hash.
 */
export async function comparePassword(
	plain: string,
	hash: string,
): Promise<boolean> {
	return bcrypt.compare(plain, hash);
}
