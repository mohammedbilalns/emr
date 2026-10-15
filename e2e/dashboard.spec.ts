import { expect, test } from "@playwright/test";
import {
	loginAsAdmin,
	loginAsDoctor,
	loginAsReceptionist,
} from "./helpers/auth";

test.describe("Dashboard Operations across Clinical Roles", () => {
	test("receptionist sees operational metrics and front-desk shortcuts", async ({
		page,
	}) => {
		await loginAsReceptionist(page);

		// Header & greeting
		await expect(
			page.getByRole("heading", { name: "Clinical Operations Overview" }),
		).toBeVisible();
		await expect(
			page.getByText("Welcome back, Amy Pond", { exact: false }),
		).toBeVisible();

		// Metric KPI Cards
		await expect(page.getByText("Today's Appointments")).toBeVisible();
		await expect(page.getByText("Waiting in Clinic")).toBeVisible();
		await expect(page.getByText("Scheduled & Pending")).toBeVisible();
		await expect(page.getByText("Consultations Done")).toBeVisible();

		// Front desk shortcuts
		const receptionistShortcuts = page.getByTestId("quick-shortcuts");
		await expect(
			receptionistShortcuts.getByRole("link", {
				name: /Schedule Appointment/i,
			}),
		).toBeVisible();
		await expect(
			receptionistShortcuts.getByRole("link", {
				name: /Patient Appointments/i,
			}),
		).toBeVisible();

		// Admin-only shortcuts should not appear in front-desk shortcuts
		await expect(
			receptionistShortcuts.getByRole("link", {
				name: /Doctor Schedules/i,
			}),
		).not.toBeVisible();
		await expect(
			receptionistShortcuts.getByRole("link", {
				name: /Receptionist Staff/i,
			}),
		).not.toBeVisible();
	});

	test("doctor sees consultation dashboard and personalized queue", async ({
		page,
	}) => {
		await loginAsDoctor(page);

		await expect(
			page.getByRole("heading", { name: "Clinical Operations Overview" }),
		).toBeVisible();
		await expect(
			page.getByText("Welcome back, Dr. Sarah Chen", { exact: false }),
		).toBeVisible();

		// Doctor should have appointments shortcut but not scheduler or admin shortcuts
		const doctorShortcuts = page.getByTestId("quick-shortcuts");
		await expect(
			doctorShortcuts.getByRole("link", { name: /Patient Appointments/i }),
		).toBeVisible();
		await expect(
			doctorShortcuts.getByRole("link", { name: /Schedule Appointment/i }),
		).not.toBeVisible();
		await expect(
			doctorShortcuts.getByRole("link", { name: /Doctor Schedules/i }),
		).not.toBeVisible();
	});

	test("administrator sees comprehensive clinic metrics and all system shortcuts", async ({
		page,
	}) => {
		await loginAsAdmin(page);

		await expect(
			page.getByRole("heading", { name: "Clinical Operations Overview" }),
		).toBeVisible();

		// Super Admin sees all shortcuts
		const adminShortcuts = page.getByTestId("quick-shortcuts");
		await expect(
			adminShortcuts.getByRole("link", { name: /Schedule Appointment/i }),
		).toBeVisible();
		await expect(
			adminShortcuts.getByRole("link", { name: /Patient Appointments/i }),
		).toBeVisible();
		await expect(
			adminShortcuts.getByRole("link", { name: /Doctor Schedules/i }),
		).toBeVisible();
		await expect(
			adminShortcuts.getByRole("link", { name: /Receptionist Staff/i }),
		).toBeVisible();
	});
});
