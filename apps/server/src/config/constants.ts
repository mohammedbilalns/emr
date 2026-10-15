export enum HttpStatus {
	OK = 200,
	CREATED = 201,
	NO_CONTENT = 204,
	BAD_REQUEST = 400,
	UNAUTHORIZED = 401,
	FORBIDDEN = 403,
	NOT_FOUND = 404,
	CONFLICT = 409,
	UNPROCESSABLE_ENTITY = 422,
	INTERNAL_SERVER_ERROR = 500,
}

export const ErrorMessages = {
	INTERNAL_SERVER_ERROR:
		"An unexpected error occurred. Please try again later.",
	VALIDATION: "Validation failed",
	UNAUTHORIZED: "Authentication required",
	INVALID_CREDENTIALS: "Invalid email or password",
	INVALID_REFRESH_TOKEN: "Your session has expired. Please log in again.",
	FORBIDDEN: "You do not have permission to perform this action",
	NOT_FOUND: "Resource not found",
	CONFLICT: "This resource already exists",
} as const;

export const API_PREFIX = "/api/v1";

export const COOKIE_NAMES = {
	REFRESH_TOKEN: "emr_rt",
} as const;

export const PAGINATION = {
	DEFAULT_PAGE: 1,
	DEFAULT_LIMIT: 10,
	MAX_LIMIT: 100,
} as const;

export const AUDIT_ACTIONS = {
	LOGIN: "LOGIN",
	LOGIN_FAILED: "LOGIN_FAILED",
	LOGOUT: "LOGOUT",
	TOKEN_REFRESHED: "TOKEN_REFRESHED",
	PATIENT_CREATED: "PATIENT_CREATED",
	DOCTOR_CREATED: "DOCTOR_CREATED",
	STAFF_CREATED: "STAFF_CREATED",
	SCHEDULE_UPDATED: "SCHEDULE_UPDATED",
	APPOINTMENT_CREATED: "APPOINTMENT_CREATED",
	APPOINTMENT_UPDATED: "APPOINTMENT_UPDATED",
	APPOINTMENT_CANCELLED: "APPOINTMENT_CANCELLED",
	PATIENT_ARRIVED: "PATIENT_ARRIVED",
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];
