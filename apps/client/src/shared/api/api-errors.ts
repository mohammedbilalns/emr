import { type ApiError, formatFriendlyErrorMessage } from "@emr/shared";
import axios, { type AxiosError } from "axios";

export interface FieldError {
	path: string;
	message: string;
}

/**
 * Client-side error wrapper preserving HTTP status codes and field-level validation errors.
 */
export class ApiClientError extends Error {
	public readonly statusCode?: number;
	public readonly fieldErrors: FieldError[];

	constructor(
		message: string,
		statusCode?: number,
		fieldErrors: FieldError[] = [],
	) {
		super(formatFriendlyErrorMessage(message));
		this.name = "ApiClientError";
		this.statusCode = statusCode;
		this.fieldErrors = fieldErrors;
	}
}

function isApiErrorPayload(data: unknown): data is ApiError {
	return (
		typeof data === "object" &&
		data !== null &&
		"success" in data &&
		(data as { success: unknown }).success === false &&
		"message" in data &&
		typeof (data as { message: unknown }).message === "string"
	);
}

/**
 * Normalizes Axios errors, API error payloads, or runtime exceptions into a uniform ApiClientError.
 */
export function normalizeError(error: unknown): ApiClientError {
	if (error instanceof ApiClientError) {
		return error;
	}

	if (axios.isAxiosError(error)) {
		const axiosErr = error as AxiosError;
		const status = axiosErr.response?.status;
		const data = axiosErr.response?.data;

		if (isApiErrorPayload(data)) {
			const fieldErrors: FieldError[] = Array.isArray(data.errors)
				? data.errors.map((e) => ({
						path: String(e.path),
						message: formatFriendlyErrorMessage(
							String(e.message),
							String(e.path),
						),
					}))
				: [];

			return new ApiClientError(
				formatFriendlyErrorMessage(data.message),
				status,
				fieldErrors,
			);
		}

		if (
			typeof data === "object" &&
			data !== null &&
			"message" in data &&
			typeof (data as { message: unknown }).message === "string" &&
			(data as { message: string }).message.trim().length > 0
		) {
			const rawErrors = (data as { errors?: unknown }).errors;
			const fieldErrors: FieldError[] = Array.isArray(rawErrors)
				? rawErrors
						.filter(
							(e): e is { path: unknown; message: unknown } =>
								typeof e === "object" &&
								e !== null &&
								"path" in e &&
								"message" in e,
						)
						.map((e) => ({
							path: String(e.path),
							message: String(e.message),
						}))
				: [];

			return new ApiClientError(
				(data as { message: string }).message,
				status,
				fieldErrors,
			);
		}

		if (
			typeof data === "object" &&
			data !== null &&
			"error" in data &&
			typeof (data as { error: unknown }).error === "string" &&
			(data as { error: string }).error.trim().length > 0
		) {
			return new ApiClientError((data as { error: string }).error, status);
		}

		if (typeof data === "string" && data.trim().length > 0) {
			return new ApiClientError(data, status);
		}

		return new ApiClientError(
			axiosErr.message || "Network request failed",
			status,
		);
	}

	if (error instanceof Error) {
		return new ApiClientError(error.message);
	}

	return new ApiClientError("An unexpected error occurred");
}

/**
 * Resolves a user-facing error message string from an unknown caught error.
 */
export function getErrorMessage(
	error: unknown,
	fallback = "An error occurred",
): string {
	if (!error) return fallback;
	const normalized = normalizeError(error);
	return formatFriendlyErrorMessage(normalized.message || fallback);
}
