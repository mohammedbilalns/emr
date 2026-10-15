import { expect, test } from "@playwright/test";
import { loginAsReceptionist, logout, TEST_USERS } from "./helpers/auth";

test.describe("Authentication and Session Lifecycle", () => {
	test("redirects unauthenticated users to the login page", async ({
		page,
	}) => {
		await page.goto("/dashboard");
		await expect(page).toHaveURL(/.*\/login/);
		await expect(
			page.getByRole("heading", { name: "Staff Sign In" }),
		).toBeVisible();
	});

	test("displays an error message when providing invalid credentials", async ({
		page,
	}) => {
		await page.goto("/login");
		await page.fill('input[name="email"]', "invalid.user@emr.local");
		await page.fill('input[name="password"]', "WrongPassword@123");
		await page.click('button[type="submit"]');

		// Toast or in-form alert
		const errorBanner = page.locator(".bg-rose-50");
		await expect(errorBanner).toBeVisible({ timeout: 5000 });
		await expect(page).toHaveURL(/.*\/login/);
	});

	test("populates credentials via quick switch buttons", async ({ page }) => {
		await page.goto("/login");

		// Click Administrator quick switch
		await page.getByRole("button", { name: /Administrator/i }).click();
		await expect(page.locator('input[name="email"]')).toHaveValue(
			TEST_USERS.admin.email,
		);

		// Click Receptionist quick switch
		await page.getByRole("button", { name: /Receptionist/i }).click();
		await expect(page.locator('input[name="email"]')).toHaveValue(
			TEST_USERS.receptionist.email,
		);

		// Click Doctor quick switch
		await page.getByRole("button", { name: /Doctor/i }).click();
		await expect(page.locator('input[name="email"]')).toHaveValue(
			TEST_USERS.doctorSarah.email,
		);
	});

	test("authenticates successfully, preserves session, and signs out", async ({
		page,
	}) => {
		await loginAsReceptionist(page);

		// Verify header shows user info
		await expect(page.getByText("Amy Pond", { exact: true })).toBeVisible();
		await expect(page.getByText("RECEPTIONIST", { exact: true })).toBeVisible();

		// Guest route guard: navigating back to /login should redirect to /dashboard
		await page.goto("/login");
		await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 10_000 });

		// Sign out and verify redirection back to /login
		await logout(page);

		// Verify protected route cannot be accessed after sign out
		await page.goto("/dashboard");
		await expect(page).toHaveURL(/.*\/login/);
	});
});
