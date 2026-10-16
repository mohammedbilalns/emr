import { connectDatabase, disconnectDatabase } from "../config/db";
import logger from "../logging/logger";
import {
	listDepartments,
	migrateDoctorDepartments,
} from "../modules/departments";

async function main(): Promise<void> {
	await connectDatabase();

	try {
		console.log("Starting doctor departments migration...");
		const { created, updatedDoctors } = await migrateDoctorDepartments();

		if (created.length > 0) {
			console.log(
				`✓ Created ${created.length} new department(s) in collection:`,
			);
			for (const name of created) {
				console.log(`  • ${name}`);
			}
		} else {
			console.log(
				"✓ All existing doctor departments are already registered in Department collection.",
			);
		}

		console.log(
			`✓ Synchronized doctor documents: ${updatedDoctors} doctor(s) updated.\n`,
		);

		const all = await listDepartments();
		console.log("Current clinical departments in database:");
		for (const d of all) {
			console.log(`  • ${d.name}`);
		}
		console.log("\nMigration completed successfully.");
	} catch (error: unknown) {
		const message =
			error instanceof Error ? error.message : "Unknown error occurred";
		console.error(`\n✗ Migration failed: ${message}\n`);
		process.exit(1);
	} finally {
		await disconnectDatabase();
	}
}

main().catch((err: unknown) => {
	logger.error({ err }, "Fatal error executing migrate-departments script");
	process.exit(1);
});
