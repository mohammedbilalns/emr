import { expect, test } from "@playwright/test";
import { loginAsReceptionist } from "./helpers/auth";

/**
 * Returns the next upcoming weekday (Monday - Friday) in YYYY-MM-DD format.
 */
function getNextWeekday(): string {
	const date = new Date();
	date.setDate(date.getDate() + 1);
	while (date.getDay() === 0 || date.getDay() === 6) {
		date.setDate(date.getDate() + 1);
	}
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

test.describe("Appointment Scheduling and Booking Workflow", () => {
	test.beforeEach(async ({ page }) => {
		await loginAsReceptionist(page);
		await page.goto("/scheduler");
		await expect(
			page.getByRole("heading", { name: "Appointment Scheduler" }),
		).toBeVisible();
	});

	test("filters doctors by department and updates schedule information", async ({
		page,
	}) => {
		const departmentSelect = page
			.locator("label", { hasText: "Department" })
			.locator("..")
			.locator("select");

		const doctorBanner = page.locator("div.flex-wrap", {
			hasText: "Slot Duration:",
		});

		// Filter by Cardiology
		await departmentSelect.selectOption("Cardiology");
		await expect(doctorBanner.getByText("Dr. Sarah Chen")).toBeVisible();
		await expect(doctorBanner.getByText("15 mins")).toBeVisible();

		// Filter by Neurology
		await departmentSelect.selectOption("Neurology");
		await expect(doctorBanner.getByText("Dr. James Wilson")).toBeVisible();
		await expect(doctorBanner.getByText("30 mins")).toBeVisible();
	});

	test("books an appointment for an existing patient", async ({ page }) => {
		const departmentSelect = page
			.locator("label", { hasText: "Department" })
			.locator("..")
			.locator("select");
		await departmentSelect.selectOption("Cardiology");

		const targetDate = getNextWeekday();
		await page.fill("input#scheduler-date", targetDate);

		// Wait for slots to load
		await expect(
			page.getByText("Available to Book", { exact: false }),
		).toBeVisible({ timeout: 10_000 });

		// Target a specific open slot by its time
		const openSlot = page
			.locator("button", {
				has: page.locator("span", { hasText: "Open" }),
			})
			.first();
		await expect(openSlot).toBeVisible();

		const slotTime = (
			await openSlot.locator("span.font-mono").textContent()
		)?.trim();
		if (!slotTime) {
			throw new Error("Unable to determine open slot time");
		}

		const specificSlotButton = page.locator("button", {
			has: page.locator("span.font-mono", { hasText: slotTime }),
		});
		await specificSlotButton.click();

		// Booking modal should be open
		const modal = page.locator('div[role="dialog"]');
		await expect(modal).toBeVisible();
		await expect(
			modal.getByRole("heading", { name: "Schedule Appointment" }),
		).toBeVisible();

		// Search for existing patient "Alice"
		await modal.locator("#patient-search-input").fill("Alice");
		const selectPatientBtn = modal.getByRole("button", { name: "Select" });
		await expect(selectPatientBtn).toBeVisible({ timeout: 5000 });
		await selectPatientBtn.click();

		// Verify patient selected pill
		await expect(modal.getByText("Alice Johnson")).toBeVisible();
		await expect(modal.getByText("P000001", { exact: false })).toBeVisible();

		// Enter purpose
		await modal
			.locator("#purpose-textarea")
			.fill("Cardiology follow-up consultation and ECG");

		// Submit booking
		await modal.getByRole("button", { name: "Confirm Appointment" }).click();

		// Modal should close
		await expect(modal).not.toBeVisible({ timeout: 10_000 });

		// Verify the specific slot button updates to booked/disabled
		await expect(specificSlotButton).toBeDisabled();
	});

	test("registers and books an appointment for a new patient", async ({
		page,
	}) => {
		const departmentSelect = page
			.locator("label", { hasText: "Department" })
			.locator("..")
			.locator("select");
		await departmentSelect.selectOption("Cardiology");

		const targetDate = getNextWeekday();
		await page.fill("input#scheduler-date", targetDate);

		// Wait for slots to load
		await expect(
			page.getByText("Available to Book", { exact: false }),
		).toBeVisible({ timeout: 10_000 });

		// Target a specific open slot by its time
		const openSlot = page
			.locator("button", {
				has: page.locator("span", { hasText: "Open" }),
			})
			.first();
		await expect(openSlot).toBeVisible();

		const slotTime = (
			await openSlot.locator("span.font-mono").textContent()
		)?.trim();
		if (!slotTime) {
			throw new Error("Unable to determine open slot time");
		}

		const specificSlotButton = page.locator("button", {
			has: page.locator("span.font-mono", { hasText: slotTime }),
		});
		await specificSlotButton.click();

		// Booking modal opens
		const modal = page.locator('div[role="dialog"]');
		await expect(modal).toBeVisible();

		// Switch to New Patient Registration
		await modal
			.getByRole("button", { name: "New Patient Registration" })
			.click();

		// Generate unique mobile number to prevent collision
		const uniqueMobile = `98${Math.floor(10000000 + Math.random() * 90000000)}`;

		// Fill new patient form within modal scope
		await modal
			.locator('input[placeholder="e.g. Jane Doe"]')
			.fill("Eleanor Vance");
		await modal.locator('input[placeholder="9876543201"]').fill(uniqueMobile);
		await modal.locator('input[type="date"]').fill("1993-06-15");
		await modal
			.locator("#purpose-textarea")
			.fill("First-time comprehensive consultation");

		// Submit booking
		await modal.getByRole("button", { name: "Confirm Appointment" }).click();

		// Modal closes
		await expect(modal).not.toBeVisible({ timeout: 10_000 });

		// Specific slot now reflects booked state
		await expect(specificSlotButton).toBeDisabled();
	});
});
