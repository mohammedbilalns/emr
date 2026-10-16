import type { Role } from "../constants/roles";

export interface StaffDto {
	id: string;
	name: string;
	email: string;
	role: Role;
	isActive: boolean;
	createdAt?: string;
}
