import { stdin as input, stdout as output } from "node:process";
import readline from "node:readline/promises";
import { connectDatabase, disconnectDatabase } from "../config/db";
import logger from "../logging/logger";
import { createDepartment, listDepartments } from "../modules/departments";

async function main(): Promise<void> {
	let rawName = process.argv.slice(2).join(" ").trim();

	if (!rawName) {
		const rl = readline.createInterface({ input, output });
		try {
			rawName = await rl.question("Enter department name to add: ");
		} finally {
			rl.close();
		}
	}

	const trimmedName = rawName.trim();
	if (!trimmedName) {
		console.error("Error: Department name cannot be empty.");
		process.exit(1);
	}

	await connectDatabase();

	try {
		const dept = await createDepartment(trimmedName);
		console.log(
			`\n✓ Success: Department "${dept.name}" created successfully.\n`,
		);

		const all = await listDepartments();
		console.log("Current clinical departments in database:");
		for (const d of all) {
			console.log(`  • ${d.name}`);
		}
		console.log("");
	} catch (error: unknown) {
		const message =
			error instanceof Error ? error.message : "Unknown error occurred";
		console.error(`\n✗ Error: ${message}\n`);
		process.exit(1);
	} finally {
		await disconnectDatabase();
	}
}

main().catch((err: unknown) => {
	logger.error({ err }, "Fatal error executing add-department script");
	process.exit(1);
});
