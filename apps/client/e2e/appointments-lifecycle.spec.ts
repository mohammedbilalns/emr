import { expect, test } from "@playwright/test";
import { loginAsDoctor, loginAsReceptionist } from "./helpers/auth";

test.describe("Clinical Appointments Lifecycle and State Transitions", () => {
	test("receptionist marks patient arrived, updates consultation notes, and cancels booking", async ({
		page,
	}) => {
		await loginAsReceptionist(page);
		await page.goto("/appointments");
		await expect(
			page.getByRole("heading", { name: "Appointments" }),
		).toBeVisible();

		// Switch to Scheduled tab to locate a scheduled booking
		await page.getByRole("button", { name: "Scheduled" }).click();

		// Locate the first scheduled row for Alice Johnson
		const aliceRow = page
			.locator("tr", {
				has: page.locator("text=Alice Johnson"),
			})
			.first();
		await expect(aliceRow).toBeVisible({ timeout: 10_000 });
		await expect(aliceRow.getByText("SCHEDULED")).toBeVisible();

		// Mark patient as arrived
		const arriveBtn = aliceRow.getByRole("button", { name: "Arrive" });
		await arriveBtn.click();

		// Switch to Arrived tab to verify patient arrival state
		await page.getByRole("button", { name: "Arrived" }).click();
		const arrivedAliceRow = page
			.locator("tr", {
				has: page.locator("text=Alice Johnson"),
			})
			.first();
		await expect(arrivedAliceRow).toBeVisible({ timeout: 5000 });
		await expect(arrivedAliceRow.getByText("ARRIVED")).toBeVisible();

		// Open Edit Notes modal
		const editBtn = arrivedAliceRow.getByRole("button", {
			name: "Edit notes and purpose",
		});
		await editBtn.click();

		const editModal = page.locator('div[role="dialog"]');
		await expect(editModal).toBeVisible();
		await expect(
			editModal.getByRole("heading", { name: "Update Consultation Details" }),
		).toBeVisible();

		// Update purpose and consultation notes
		await modalField(page, "#edit-purpose").fill(
			"Acute chest discomfort follow-up",
		);
		await modalField(page, "#edit-notes").fill(
			"Blood pressure 128/82. Scheduled for resting 12-lead ECG.",
		);
		await editModal.getByRole("button", { name: "Save Changes" }).click();
		await expect(editModal).not.toBeVisible({ timeout: 5000 });

		// Verify changes via View Details modal
		const detailsBtn = arrivedAliceRow.getByRole("button", {
			name: "View appointment details",
		});
		await detailsBtn.click();

		const detailsModal = page.locator('div[role="dialog"]');
		await expect(detailsModal).toBeVisible();
		await expect(
			detailsModal.getByText("Acute chest discomfort follow-up"),
		).toBeVisible();
		await expect(detailsModal.getByText("Blood pressure 128/82")).toBeVisible();

		await detailsModal.getByRole("button", { name: "Close Record" }).click();
		await expect(detailsModal).not.toBeVisible();

		// Switch to All Appointments to locate Charlie Brown for cancellation
		await page.getByRole("button", { name: "All Appointments" }).click();
		const charlieRow = page
			.locator("tr", {
				has: page.locator("text=Charlie Brown"),
			})
			.first();
		await expect(charlieRow).toBeVisible({ timeout: 10_000 });

		// Trigger cancellation
		const cancelBtn = charlieRow.getByRole("button", {
			name: "Cancel appointment",
		});
		await cancelBtn.click();

		const cancelModal = page.locator('div[role="dialog"]');
		await expect(cancelModal).toBeVisible();
		await expect(
			cancelModal.getByRole("heading", { name: "Cancel Appointment" }),
		).toBeVisible();

		// Confirm cancellation
		await cancelModal
			.getByRole("button", { name: "Cancel Appointment" })
			.click();
		await expect(cancelModal).not.toBeVisible({ timeout: 5000 });

		// Verify status changed to CANCELLED
		await expect(charlieRow.getByText("CANCELLED")).toBeVisible({
			timeout: 5000,
		});
	});

	test("doctor completes consultation for an arrived patient", async ({
		page,
	}) => {
		// Log in as Dr. Sarah Chen
		await loginAsDoctor(page);
		await page.goto("/appointments");
		await expect(
			page.getByRole("heading", { name: "Appointments" }),
		).toBeVisible();

		// Filter for Arrived patients
		await page.getByRole("button", { name: "Arrived" }).click();

		// Bob Smith is seeded as ARRIVED for Dr. Sarah Chen
		const arrivedRow = page
			.locator("tr", {
				has: page.locator("text=Bob Smith"),
			})
			.first();
		await expect(arrivedRow).toBeVisible({ timeout: 10_000 });
		await expect(arrivedRow.getByText("ARRIVED")).toBeVisible();

		// Complete the consultation
		const completeBtn = arrivedRow.getByRole("button", { name: "Complete" });
		await expect(completeBtn).toBeVisible();
		await completeBtn.click();

		// Switch to Completed tab to verify completion state
		await page.getByRole("button", { name: "Completed" }).click();
		const completedRow = page
			.locator("tr", {
				has: page.locator("text=Bob Smith"),
			})
			.first();
		await expect(completedRow).toBeVisible({ timeout: 5000 });
		await expect(completedRow.getByText("COMPLETED")).toBeVisible();
	});
});

function modalField(page: import("@playwright/test").Page, selector: string) {
	return page.locator('div[role="dialog"]').locator(selector);
}
