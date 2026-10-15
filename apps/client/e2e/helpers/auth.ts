import { expect, type Page } from "@playwright/test";

export const TEST_USERS = {
	admin: {
		email: "admin@emr.local",
		password: "Admin@12345",
		name: "Super Admin",
		role: "SUPER_ADMIN",
	},
	receptionist: {
		email: "receptionist@emr.local",
		password: "Recept@12345",
		name: "Amy Pond",
		role: "RECEPTIONIST",
	},
	doctorSarah: {
		email: "sarah.chen@emr.local",
		password: "Doctor@12345",
		name: "Dr. Sarah Chen",
		role: "DOCTOR",
	},
	doctorJames: {
		email: "james.wilson@emr.local",
		password: "Doctor@12345",
		name: "Dr. James Wilson",
		role: "DOCTOR",
	},
} as const;

/**
 * Authenticates a user through the UI login form and waits for the dashboard to load.
 */
export async function loginAs(
	page: Page,
	email: string,
	pass: string,
): Promise<void> {
	await page.goto("/login");
	await page.fill('input[name="email"]', email);
	await page.fill('input[name="password"]', pass);
	await page.click('button[type="submit"]');

	// Wait for dashboard redirect and brand banner
	await page.waitForURL("**/dashboard", { timeout: 15_000 });
	await expect(
		page.getByRole("heading", { name: "Clinical Operations Overview" }),
	).toBeVisible();
}

/**
 * Logs in as the primary clinic receptionist.
 */
export async function loginAsReceptionist(page: Page): Promise<void> {
	await loginAs(
		page,
		TEST_USERS.receptionist.email,
		TEST_USERS.receptionist.password,
	);
}

/**
 * Logs in as Dr. Sarah Chen (Cardiology).
 */
export async function loginAsDoctor(page: Page): Promise<void> {
	await loginAs(
		page,
		TEST_USERS.doctorSarah.email,
		TEST_USERS.doctorSarah.password,
	);
}

/**
 * Logs in as the clinic Super Administrator.
 */
export async function loginAsAdmin(page: Page): Promise<void> {
	await loginAs(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
}

/**
 * Performs a sign-out operation from the navigation header.
 */
export async function logout(page: Page): Promise<void> {
	const signOutBtn = page.getByRole("button", { name: /sign out/i });
	await signOutBtn.click();
	await page.waitForURL("**/login", { timeout: 10_000 });
	await expect(
		page.getByRole("heading", { name: "Staff Sign In" }),
	).toBeVisible();
}
