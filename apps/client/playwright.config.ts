import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E configuration for testing the full clinical workflow.
 * Automatically spawns both the backend API server and the frontend Vite dev server.
 */
export default defineConfig({
	testDir: "./e2e",
	fullyParallel: false,
	forbidOnly: Boolean(process.env.CI),
	retries: process.env.CI ? 2 : 0,
	workers: 1,
	reporter: "list",
	use: {
		baseURL: "http://localhost:5173",
		trace: "on-first-retry",
		screenshot: "only-on-failure",
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],
	webServer: [
		{
			command: "npm run dev:api",
			cwd: "../../",
			url: "http://localhost:3000/health",
			reuseExistingServer: !process.env.CI,
			timeout: 60_000,
		},
		{
			command: "npm run dev:web",
			cwd: "../../",
			url: "http://localhost:5173",
			reuseExistingServer: !process.env.CI,
			timeout: 60_000,
		},
	],
});
