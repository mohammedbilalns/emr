import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";

test.describe("Super Admin Clinical and Staff Management", () => {
	test.beforeEach(async ({ page }) => {
		await loginAsAdmin(page);
	});

	test("creates a new physician and updates clinical consultation hours", async ({
		page,
	}) => {
		await page.goto("/doctors");
		await expect(
			page.getByRole("heading", { name: "Doctor Schedules" }),
		).toBeVisible();

		// Open Create Physician modal
		await page.getByRole("button", { name: "Add Physician" }).click();
		const createModal = page.locator('div[role="dialog"]');
		await expect(createModal).toBeVisible();
		await expect(
			createModal.getByRole("heading", { name: "Register New Physician" }),
		).toBeVisible();

		const uniqueSuffix = Date.now();
		const uniqueEmail = `doctor.${uniqueSuffix}@emr.local`;
		const doctorName = `Dr. Clara ${uniqueSuffix}`;

		// Fill physician registration
		await createModal
			.locator('input[placeholder="e.g. Dr. Robert House"]')
			.fill(doctorName);
		await createModal
			.locator('input[placeholder="dr.house@emr.local"]')
			.fill(uniqueEmail);
		await createModal
			.locator('input[placeholder="••••••••••••"]')
			.fill("Doctor@12345");
		await createModal
			.locator('input[placeholder="e.g. Cardiology, Neurology"]')
			.fill("Pediatrics");

		// Select 20 minutes consultation duration
		await createModal.locator("select").selectOption("20");

		// Submit creation
		await createModal.getByRole("button", { name: "Create Physician" }).click();
		await expect(createModal).not.toBeVisible({ timeout: 10_000 });

		// Verify physician card appears on the roster
		const newDocCard = page
			.getByTestId("doctor-card")
			.filter({ hasText: doctorName });
		await expect(newDocCard).toBeVisible({ timeout: 5000 });
		await expect(newDocCard.getByText("Pediatrics")).toBeVisible();

		// Configure Schedule for the newly registered physician
		await newDocCard
			.getByRole("button", { name: "Configure Schedule" })
			.click();

		const scheduleModal = page.locator('div[role="dialog"]');
		await expect(scheduleModal).toBeVisible();
		await expect(
			scheduleModal.getByRole("heading", {
				name: new RegExp(`Configure Schedule · ${doctorName}`),
			}),
		).toBeVisible();

		// Change consultation duration to 30 minutes
		await scheduleModal.locator("select").selectOption("30");

		// Submit updated schedule
		await scheduleModal
			.getByRole("button", { name: "Save Physician Schedule" })
			.click();
		await expect(scheduleModal).not.toBeVisible({ timeout: 10_000 });

		// Verify updated slot duration badge on newly created doctor's card
		await expect(newDocCard.getByText("30 min consultations")).toBeVisible({
			timeout: 5000,
		});
	});

	test("onboards a new front-desk receptionist staff member", async ({
		page,
	}) => {
		await page.goto("/staff");
		await expect(
			page.getByRole("heading", { name: "Reception Staff" }),
		).toBeVisible();

		// Open Add Receptionist modal
		await page.getByRole("button", { name: "Add Receptionist" }).click();
		const staffModal = page.locator('div[role="dialog"]');
		await expect(staffModal).toBeVisible();
		await expect(
			staffModal.getByRole("heading", { name: "Register Receptionist Staff" }),
		).toBeVisible();

		const uniqueStaffSuffix = Date.now();
		const uniqueStaffName = `Rory Williams ${uniqueStaffSuffix}`;
		const uniqueStaffEmail = `staff.${uniqueStaffSuffix}@emr.local`;

		// Fill staff registration form
		await staffModal
			.locator('input[placeholder="e.g. Clara Oswald"]')
			.fill(uniqueStaffName);
		await staffModal
			.locator('input[placeholder="clara@emr.local"]')
			.fill(uniqueStaffEmail);
		await staffModal
			.locator('input[placeholder="••••••••••••"]')
			.fill("Recept@12345");

		// Submit registration
		await staffModal
			.getByRole("button", { name: "Register Receptionist" })
			.click();
		await expect(staffModal).not.toBeVisible({ timeout: 10_000 });

		// Verify success toast appears with staff name
		await expect(page.getByText(uniqueStaffName, { exact: false })).toBeVisible(
			{ timeout: 5000 },
		);
	});
});
