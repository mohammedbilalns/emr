import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { connectDatabase } from "../../src/config/db";
import { ConflictError, ValidationError } from "../../src/errors/base.error";
import {
	createDepartment,
	Department,
	listDepartments,
} from "../../src/modules/departments";

describe("Department Service & Duplicate Checking", () => {
	const testDeptName = `Test Oncology ${Date.now()}`;

	beforeAll(async () => {
		await connectDatabase();
	});

	afterAll(async () => {
		// Clean up created test departments
		await Department.deleteMany({
			nameNormalized: /^test oncology/i,
		});
	});

	it("creates a new department with trimmed name and normalized index", async () => {
		const dept = await createDepartment(`  ${testDeptName}  `);
		expect(dept.name).toBe(testDeptName);
		expect(dept.nameNormalized).toBe(testDeptName.toLowerCase());
		expect(dept.isActive).toBe(true);

		const inDb = await Department.findOne({
			nameNormalized: testDeptName.toLowerCase(),
		});
		expect(inDb).not.toBeNull();
		expect(inDb?.name).toBe(testDeptName);
	});

	it("rejects exact duplicate department names with ConflictError", async () => {
		await expect(createDepartment(testDeptName)).rejects.toThrow(ConflictError);
		await expect(createDepartment(testDeptName)).rejects.toThrow(
			/already exists/i,
		);
	});

	it("rejects case-insensitive duplicate department names with ConflictError", async () => {
		// Lowercase
		await expect(createDepartment(testDeptName.toLowerCase())).rejects.toThrow(
			ConflictError,
		);

		// Uppercase
		await expect(createDepartment(testDeptName.toUpperCase())).rejects.toThrow(
			ConflictError,
		);

		// Mixed case with leading/trailing spaces
		await expect(
			createDepartment(`   ${testDeptName.toUpperCase()}   `),
		).rejects.toThrow(ConflictError);
	});

	it("rejects duplicate department if it already belongs to a physician", async () => {
		// Cardiology is seeded for Dr. Sarah Chen
		await expect(createDepartment("Cardiology")).rejects.toThrow(ConflictError);
		await expect(createDepartment("cardiology")).rejects.toThrow(ConflictError);
		await expect(createDepartment("  CARDIOLOGY  ")).rejects.toThrow(
			ConflictError,
		);
	});

	it("validates empty, whitespace-only, and out-of-range names with ValidationError", async () => {
		await expect(createDepartment("")).rejects.toThrow(ValidationError);
		await expect(createDepartment("   ")).rejects.toThrow(ValidationError);
		await expect(createDepartment("A")).rejects.toThrow(ValidationError);
		await expect(createDepartment("A".repeat(61))).rejects.toThrow(
			ValidationError,
		);
	});

	it("lists all active departments sorted alphabetically", async () => {
		const depts = await listDepartments();
		expect(Array.isArray(depts)).toBe(true);
		expect(depts.length).toBeGreaterThan(0);

		// Verify alphabetical order
		for (let i = 1; i < depts.length; i++) {
			expect(
				depts[i - 1].name.localeCompare(depts[i].name),
			).toBeLessThanOrEqual(0);
		}
	});
});
