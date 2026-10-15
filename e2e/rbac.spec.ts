import { expect, test } from "@playwright/test";
import {
	loginAsAdmin,
	loginAsDoctor,
	loginAsReceptionist,
} from "./helpers/auth";

test.describe("Role-Based Access Control (RBAC) and Security Boundaries", () => {
	test("enforces view restrictions and route guards for Receptionist role", async ({
		page,
	}) => {
		await loginAsReceptionist(page);

		// Sidebar checks: Scheduler & Appointments visible, Doctors & Staff hidden
		const nav = page.locator("nav");
		await expect(nav.getByRole("link", { name: "Dashboard" })).toBeVisible();
		await expect(
			nav.getByRole("link", { name: "Scheduler & Booking" }),
		).toBeVisible();
		await expect(nav.getByRole("link", { name: "Appointments" })).toBeVisible();
		await expect(
			nav.getByRole("link", { name: "Doctor Schedules" }),
		).not.toBeVisible();
		await expect(
			nav.getByRole("link", { name: "Staff Directory" }),
		).not.toBeVisible();

		// Direct access to /doctors should be guarded
		await page.goto("/doctors");
		await expect(
			page.getByRole("heading", { name: "Access Restricted" }),
		).toBeVisible();
		await expect(
			page.getByText("Your assigned role (RECEPTIONIST)"),
		).toBeVisible();

		// Direct access to /staff should be guarded
		await page.goto("/staff");
		await expect(
			page.getByRole("heading", { name: "Access Restricted" }),
		).toBeVisible();
	});

	test("enforces view restrictions and route guards for Doctor role", async ({
		page,
	}) => {
		await loginAsDoctor(page);

		// Sidebar checks: Only Dashboard and Appointments visible
		const nav = page.locator("nav");
		await expect(nav.getByRole("link", { name: "Dashboard" })).toBeVisible();
		await expect(nav.getByRole("link", { name: "Appointments" })).toBeVisible();
		await expect(
			nav.getByRole("link", { name: "Scheduler & Booking" }),
		).not.toBeVisible();
		await expect(
			nav.getByRole("link", { name: "Doctor Schedules" }),
		).not.toBeVisible();
		await expect(
			nav.getByRole("link", { name: "Staff Directory" }),
		).not.toBeVisible();

		// Direct access to /scheduler should be guarded
		await page.goto("/scheduler");
		await expect(
			page.getByRole("heading", { name: "Access Restricted" }),
		).toBeVisible();
		await expect(page.getByText("Your assigned role (DOCTOR)")).toBeVisible();

		// Direct access to /doctors should be guarded
		await page.goto("/doctors");
		await expect(
			page.getByRole("heading", { name: "Access Restricted" }),
		).toBeVisible();

		// Direct access to /staff should be guarded
		await page.goto("/staff");
		await expect(
			page.getByRole("heading", { name: "Access Restricted" }),
		).toBeVisible();
	});

	test("grants complete administrative access to Super Admin", async ({
		page,
	}) => {
		await loginAsAdmin(page);

		// Sidebar checks: All links visible
		const nav = page.locator("nav");
		await expect(nav.getByRole("link", { name: "Dashboard" })).toBeVisible();
		await expect(
			nav.getByRole("link", { name: "Scheduler & Booking" }),
		).toBeVisible();
		await expect(nav.getByRole("link", { name: "Appointments" })).toBeVisible();
		await expect(
			nav.getByRole("link", { name: "Doctor Schedules" }),
		).toBeVisible();
		await expect(
			nav.getByRole("link", { name: "Staff Directory" }),
		).toBeVisible();

		// Navigate to Doctor Schedules management
		await page.goto("/doctors");
		await expect(
			page.getByRole("heading", { name: "Doctor Schedules" }),
		).toBeVisible();
		await expect(
			page.getByRole("button", { name: "Add Physician" }),
		).toBeVisible();
		await expect(page.getByText("Dr. Sarah Chen")).toBeVisible();

		// Navigate to Staff Directory management
		await page.goto("/staff");
		await expect(
			page.getByRole("heading", { name: "Reception Staff" }),
		).toBeVisible();
		await expect(
			page.getByRole("button", { name: "Add Receptionist" }),
		).toBeVisible();
		await expect(page.getByText("receptionist@emr.local")).toBeVisible();
	});
});
