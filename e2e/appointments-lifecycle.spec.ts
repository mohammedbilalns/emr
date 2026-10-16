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

		// Locate first scheduled row
		const scheduledRow = page.locator("tbody tr").first();
		await expect(scheduledRow).toBeVisible({ timeout: 10_000 });

		// Capture patient name to follow through arrival
		const scheduledPatientCell = scheduledRow.locator("td").first();
		const scheduledCellText = await scheduledPatientCell.innerText();
		const patientName = scheduledCellText.split("\n")[0].split("·")[0].trim();

		// Mark patient as arrived
		const arriveBtn = scheduledRow.getByRole("button", { name: "Arrive" });
		await arriveBtn.click();

		// Switch to Arrived tab to verify patient arrival state
		await page.getByRole("button", { name: "Arrived" }).click();
		const arrivedRow = page
			.locator("tr", {
				has: page.locator(`text=${patientName}`),
			})
			.first();
		await expect(arrivedRow).toBeVisible({ timeout: 5000 });
		await expect(arrivedRow.getByText("ARRIVED")).toBeVisible();

		// Open Edit Notes modal
		const editBtn = arrivedRow.getByRole("button", {
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
		const detailsBtn = arrivedRow.getByRole("button", {
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

		// Switch to Scheduled tab to locate an active booking for cancellation
		await page.getByRole("button", { name: "Scheduled" }).click();
		const rowToCancel = page
			.locator("tr", {
				has: page.getByRole("button", { name: "Cancel appointment" }),
			})
			.first();
		await expect(rowToCancel).toBeVisible({ timeout: 10_000 });

		// Trigger cancellation
		const cancelBtn = rowToCancel.getByRole("button", {
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

		// Switch to Cancelled tab to verify cancellation
		await page.getByRole("button", { name: "Cancelled" }).click();
		const cancelledRow = page.locator("tbody tr").first();
		await expect(cancelledRow).toBeVisible({ timeout: 5000 });
		await expect(cancelledRow.getByText("Cancelled")).toBeVisible();
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

		// Locate an ARRIVED appointment
		const arrivedRow = page
			.locator("tr", {
				has: page.getByText("ARRIVED"),
			})
			.first();
		await expect(arrivedRow).toBeVisible({ timeout: 10_000 });

		// Capture patient name from first column to verify on completed tab
		const patientCell = arrivedRow.locator("td").first();
		const cellText = await patientCell.innerText();
		const patientName = cellText.split("\n")[0].split("·")[0].trim();

		// Doctor updates consultation purpose and notes
		const editBtn = arrivedRow.getByRole("button", {
			name: "Edit notes and purpose",
		});
		await editBtn.click();

		const editModal = page.locator('div[role="dialog"]');
		await expect(editModal).toBeVisible();
		await expect(
			editModal.getByRole("heading", { name: "Update Consultation Details" }),
		).toBeVisible();

		await modalField(page, "#edit-purpose").fill(
			"Specialist evaluation - updated purpose",
		);
		await modalField(page, "#edit-notes").fill(
			"Doctor consultation notes updated successfully.",
		);
		await editModal.getByRole("button", { name: "Save Changes" }).click();
		await expect(editModal).not.toBeVisible({ timeout: 5000 });

		// Verify purpose and notes updated in details modal
		const detailsBtn = arrivedRow.getByRole("button", {
			name: "View appointment details",
		});
		await detailsBtn.click();
		const detailsModal = page.locator('div[role="dialog"]');
		await expect(detailsModal).toBeVisible();
		await expect(
			detailsModal.getByText("Specialist evaluation - updated purpose"),
		).toBeVisible();
		await expect(
			detailsModal.getByText("Doctor consultation notes updated successfully."),
		).toBeVisible();
		await detailsModal.getByRole("button", { name: "Close Record" }).click();
		await expect(detailsModal).not.toBeVisible();

		// Complete the consultation
		const completeBtn = arrivedRow.getByRole("button", { name: "Complete" });
		await expect(completeBtn).toBeVisible();
		await completeBtn.click();

		// Switch to Completed tab to verify completion state
		await page.getByRole("button", { name: "Completed" }).click();
		const completedRow = page
			.locator("tr", {
				has: page.locator(`text=${patientName}`),
			})
			.first();
		await expect(completedRow).toBeVisible({ timeout: 5000 });
		await expect(completedRow.getByText("COMPLETED")).toBeVisible();
	});
});

function modalField(page: import("@playwright/test").Page, selector: string) {
	return page.locator('div[role="dialog"]').locator(selector);
}
