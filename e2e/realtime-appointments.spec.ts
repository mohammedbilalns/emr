import { expect, test } from "@playwright/test";
import { loginAsReceptionist } from "./helpers/auth";

/**
 * Returns the next upcoming weekday (Monday - Friday) in YYYY-MM-DD format.
 */
function getNextWeekday(daysAhead = 1): string {
	const date = new Date();
	date.setDate(date.getDate() + daysAhead);
	while (date.getDay() === 0 || date.getDay() === 6) {
		date.setDate(date.getDate() + 1);
	}
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

test.describe("Real-Time Appointment Updates via Socket.IO", () => {
	test("multi-user: booking an appointment updates connected scheduler view in real-time without reload", async ({
		browser,
	}) => {
		const context1 = await browser.newContext();
		const context2 = await browser.newContext();

		const page1 = await context1.newPage();
		const page2 = await context2.newPage();

		try {
			await loginAsReceptionist(page1);
			await loginAsReceptionist(page2);

			const targetDate = getNextWeekday(2);

			// Receptionist 1 navigates to Scheduler
			await page1.goto("/scheduler");
			await expect(
				page1.getByRole("heading", { name: "Appointment Scheduler" }),
			).toBeVisible();

			const deptSelect1 = page1
				.locator("label", { hasText: "Department" })
				.locator("..")
				.locator("select");
			await deptSelect1.selectOption("Cardiology");
			await page1.fill("input#scheduler-date", targetDate);

			// Verify Realtime Live Indicator is active
			await expect(page1.getByText("Live").first()).toBeVisible({
				timeout: 10_000,
			});

			await expect(
				page1.getByText("Available to Book", { exact: false }),
			).toBeVisible({ timeout: 10_000 });

			// Receptionist 2 navigates to Scheduler for same doctor and date
			await page2.goto("/scheduler");
			const deptSelect2 = page2
				.locator("label", { hasText: "Department" })
				.locator("..")
				.locator("select");
			await deptSelect2.selectOption("Cardiology");
			await page2.fill("input#scheduler-date", targetDate);

			await expect(page2.getByText("Live").first()).toBeVisible({
				timeout: 10_000,
			});

			// Page 2 locates the first open slot
			const openSlotPage2 = page2
				.locator("button", {
					has: page2.locator("span", { hasText: "Open" }),
				})
				.first();
			await expect(openSlotPage2).toBeVisible({ timeout: 10_000 });

			const slotTime = (
				await openSlotPage2.locator("span.font-mono").textContent()
			)?.trim();
			if (!slotTime) {
				throw new Error("Unable to identify open slot time");
			}

			// Verify that on Page 1, this slot is currently OPEN/Available
			const slotButtonPage1 = page1.locator("button", {
				has: page1.locator("span.font-mono", { hasText: slotTime }),
			});
			await expect(slotButtonPage1).toBeEnabled();
			await expect(slotButtonPage1.getByText("Open")).toBeVisible();

			// Receptionist 2 books this slot
			await openSlotPage2.click();
			const modal2 = page2.locator('div[role="dialog"]');
			await expect(modal2).toBeVisible();

			await modal2.locator("#patient-search-input").fill("Alice");
			const selectPatientBtn = modal2.getByRole("button", { name: "Select" });
			await expect(selectPatientBtn).toBeVisible({ timeout: 5000 });
			await selectPatientBtn.click();

			await modal2
				.locator("#purpose-textarea")
				.fill("Real-time WebSocket synchronization test booking");
			await modal2.getByRole("button", { name: "Confirm Appointment" }).click();
			await expect(modal2).not.toBeVisible({ timeout: 10_000 });

			// CRITICAL ASSERTION:
			// Page 1 should receive slot:booked event over WebSockets
			// and transition the slot button to booked/disabled WITHOUT reloading!
			await expect(slotButtonPage1).toBeDisabled({ timeout: 10_000 });
			await expect(slotButtonPage1).toHaveAttribute(
				"title",
				"Slot is already booked",
			);
			await expect(slotButtonPage1.getByText("Open")).not.toBeVisible();
		} finally {
			await context1.close();
			await context2.close();
		}
	});

	test("multi-user: cancelling an appointment releases slot in real-time on connected scheduler", async ({
		browser,
	}) => {
		const context1 = await browser.newContext();
		const context2 = await browser.newContext();

		const page1 = await context1.newPage();
		const page2 = await context2.newPage();

		try {
			await loginAsReceptionist(page1);
			await loginAsReceptionist(page2);

			const targetDate = getNextWeekday(3);

			// Page 1 is watching the scheduler
			await page1.goto("/scheduler");
			const deptSelect1 = page1
				.locator("label", { hasText: "Department" })
				.locator("..")
				.locator("select");
			await deptSelect1.selectOption("Cardiology");
			await page1.fill("input#scheduler-date", targetDate);
			await expect(
				page1.getByText("Available to Book", { exact: false }),
			).toBeVisible({ timeout: 10_000 });

			// Page 2 books a slot
			await page2.goto("/scheduler");
			const deptSelect2 = page2
				.locator("label", { hasText: "Department" })
				.locator("..")
				.locator("select");
			await deptSelect2.selectOption("Cardiology");
			await page2.fill("input#scheduler-date", targetDate);

			const openSlot = page2
				.locator("button", {
					has: page2.locator("span", { hasText: "Open" }),
				})
				.first();
			await expect(openSlot).toBeVisible({ timeout: 10_000 });
			const slotTime = (
				await openSlot.locator("span.font-mono").textContent()
			)?.trim();
			if (!slotTime) throw new Error("Slot time not found");

			await openSlot.click();
			const modal2 = page2.locator('div[role="dialog"]');
			await modal2.locator("#patient-search-input").fill("Alice");
			await modal2.getByRole("button", { name: "Select" }).click();
			await modal2
				.locator("#purpose-textarea")
				.fill("Temporary booking for cancellation test");
			await modal2.getByRole("button", { name: "Confirm Appointment" }).click();
			await expect(modal2).not.toBeVisible({ timeout: 10_000 });

			const slotButtonPage1 = page1.locator("button", {
				has: page1.locator("span.font-mono", { hasText: slotTime }),
			});
			// Verify Page 1 reflects booked state via WebSocket
			await expect(slotButtonPage1).toBeDisabled({ timeout: 10_000 });

			// Now Page 2 goes to Appointments page and cancels this appointment
			await page2.goto("/appointments");
			await page2.getByRole("button", { name: "Scheduled" }).click();

			// Filter by this specific date so the booked appointment is uniquely visible
			await page2.getByLabel("From date").fill(targetDate);
			await page2.getByLabel("To date").fill(targetDate);

			const rowToCancel = page2
				.locator("tr", {
					has: page2.locator(`text=${slotTime}`),
				})
				.first();
			await expect(rowToCancel).toBeVisible({ timeout: 10_000 });

			await rowToCancel
				.getByRole("button", { name: "Cancel appointment" })
				.click();
			const cancelModal = page2.locator('div[role="dialog"]');
			await expect(cancelModal).toBeVisible();
			await cancelModal
				.getByRole("button", { name: "Cancel Appointment" })
				.click();
			await expect(cancelModal).not.toBeVisible({ timeout: 5000 });

			// CRITICAL ASSERTION:
			// Page 1's scheduler should immediately receive slot:released / appointment:cancelled
			// and re-enable the slot button to "Open" WITHOUT page reload!
			await expect(slotButtonPage1).toBeEnabled({ timeout: 10_000 });
			await expect(slotButtonPage1.getByText("Open")).toBeVisible();
		} finally {
			await context1.close();
			await context2.close();
		}
	});

	test("multi-user: updating appointment details/status syncs live to connected appointments list", async ({
		browser,
	}) => {
		const context1 = await browser.newContext();
		const context2 = await browser.newContext();

		const page1 = await context1.newPage();
		const page2 = await context2.newPage();

		try {
			await loginAsReceptionist(page1);
			await loginAsReceptionist(page2);

			// Page 1 navigates to Appointments list
			await page1.goto("/appointments");
			await page1.getByRole("button", { name: "Scheduled" }).click();

			// Locate first scheduled appointment on Page 1
			const scheduledRow1 = page1.locator("tbody tr").first();
			await expect(scheduledRow1).toBeVisible({ timeout: 10_000 });

			const scheduledPatientCell = scheduledRow1.locator("td").first();
			const patientName = (await scheduledPatientCell.innerText())
				.split("\n")[0]
				.split("·")[0]
				.trim();

			// Page 2 navigates to Appointments list and marks this patient arrived
			await page2.goto("/appointments");
			await page2.getByRole("button", { name: "Scheduled" }).click();

			const targetRowPage2 = page2
				.locator("tr", {
					has: page2.locator(`text=${patientName}`),
				})
				.first();
			await expect(targetRowPage2).toBeVisible({ timeout: 10_000 });

			const arriveBtn = targetRowPage2.getByRole("button", { name: "Arrive" });
			await arriveBtn.click();

			// CRITICAL ASSERTION:
			// Page 1 automatically receives appointment:updated event
			// React Query invalidates ["appointments"], so the scheduled row disappears from "Scheduled" tab
			// or reflects ARRIVED state without reloading the page!
			await expect(scheduledRow1).not.toHaveText(
				new RegExp(`${patientName}.*SCHEDULED`),
				{
					timeout: 10_000,
				},
			);

			// Page 1 switches to Arrived tab to verify patient arrival state
			await page1.getByRole("button", { name: "Arrived" }).click();
			const arrivedRowPage1 = page1
				.locator("tr", {
					has: page1.locator(`text=${patientName}`),
				})
				.first();
			await expect(arrivedRowPage1).toBeVisible({ timeout: 5000 });
			await expect(arrivedRowPage1.getByText("ARRIVED")).toBeVisible();
		} finally {
			await context1.close();
			await context2.close();
		}
	});
});
