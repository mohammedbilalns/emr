export const ROLES = ["SUPER_ADMIN", "RECEPTIONIST", "DOCTOR"] as const;
export type Role = (typeof ROLES)[number];
