import bcrypt from "bcryptjs";
// ---------------------------------------------------------------------------
// Seed utility module.
// Provides a function to initialize the database with a default super-admin
// user account.
// ---------------------------------------------------------------------------
import { connectDatabase, disconnectDatabase } from "../config/db";
import logger from "../logging/logger";
import { User } from "../models/user.model";

async function seed(): Promise<void> {
	await connectDatabase();

	// Read super-admin credentials from environment variables, with fallback
	// defaults so the seed script can run without explicit config.
	const email = process.env.SUPER_ADMIN_EMAIL ?? "admin@emr.local";
	const password = process.env.SUPER_ADMIN_PASSWORD ?? "Admin@12345";

	const passwordHash = await bcrypt.hash(password, 12);

	// Upsert the super-admin user record.  If a user with the given email
	// already exists, the existing record is updated; otherwise a new record
	// is created with the provided details.
	await User.findOneAndUpdate(
		{ email },
		{
			name: "Super Admin",
			email,
			passwordHash,
			role: "SUPER_ADMIN",
			isActive: true,
		},
		{ upsert: true, setDefaultsOnInsert: true },
	);

	logger.info(`Super admin ready: ${email} / ${password}`);
	await disconnectDatabase();
}

void seed().catch((error) => {
	logger.error({ error }, "Seed failed");
	process.exit(1);
});
