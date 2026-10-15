import { existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { build } from "esbuild";
import pkg from "../package.json";

async function run(): Promise<void> {
	const distDir = resolve(import.meta.dirname, "../dist");
	if (existsSync(distDir)) {
		rmSync(distDir, { recursive: true, force: true });
	}

	// Externalize all npm packages, bundling only local workspace packages like @emr/shared
	const external = Object.keys(pkg.dependencies ?? {}).filter(
		(dep) => dep !== "@emr/shared",
	);

	await build({
		entryPoints: [resolve(import.meta.dirname, "../src/server.ts")],
		bundle: true,
		platform: "node",
		target: "node20",
		format: "cjs",
		outfile: resolve(distDir, "server.js"),
		sourcemap: true,
		external,
	});

	console.log("Server build completed successfully: dist/server.js");
}

void run();
