import { ConflictError, ValidationError } from "../../errors/base.error";
import { Doctor } from "../doctors/doctor.model";
import {
	Department,
	type DepartmentDocument,
	type IDepartment,
} from "./department.model";

function escapeRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Creates a new clinical department with case-insensitive and trimmed duplicate checking.
 */
export async function createDepartment(rawName: string): Promise<IDepartment> {
	if (typeof rawName !== "string") {
		throw new ValidationError("Department name is required");
	}

	const name = rawName.trim();
	if (name.length < 2) {
		throw new ValidationError(
			"Department name must be at least 2 characters long",
		);
	}
	if (name.length > 60) {
		throw new ValidationError("Department name cannot exceed 60 characters");
	}

	const nameNormalized = name.toLowerCase();

	// Check Department collection for case-insensitive duplicate
	const existingDept = await Department.findOne({ nameNormalized });
	if (existingDept) {
		throw new ConflictError(
			`Department '${existingDept.name}' already exists (case-insensitive duplicate)`,
		);
	}

	// Check Doctor records in case doctors were seeded/created with this department
	const existingDoc = await Doctor.findOne({
		department: new RegExp(`^${escapeRegex(name)}$`, "i"),
	});
	if (existingDoc) {
		throw new ConflictError(
			`Department '${existingDoc.department}' already exists in doctor records (case-insensitive duplicate)`,
		);
	}

	return Department.create({
		name,
		nameNormalized,
		isActive: true,
	});
}

/**
 * Lists all active clinical departments sorted alphabetically by name.
 */
export async function listDepartments(): Promise<DepartmentDocument[]> {
	return Department.find({ isActive: true }).sort({ name: 1 });
}

/**
 * Migrates existing Doctor documents so that their departments exist in the Department collection,
 * and normalizes doctor.department to match the canonical department name.
 */
export async function migrateDoctorDepartments(): Promise<{
	created: string[];
	updatedDoctors: number;
}> {
	const doctors = await Doctor.find({});
	const created: string[] = [];
	let updatedDoctors = 0;

	for (const doctor of doctors) {
		const rawDept = doctor.department?.trim();
		if (!rawDept) continue;

		const nameNormalized = rawDept.toLowerCase();
		let dept = await Department.findOne({ nameNormalized });

		if (!dept) {
			dept = await Department.create({
				name: rawDept,
				nameNormalized,
				isActive: true,
			});
			created.push(dept.name);
		}

		if (doctor.department !== dept.name) {
			doctor.department = dept.name;
			await doctor.save();
			updatedDoctors++;
		}
	}

	return { created, updatedDoctors };
}
