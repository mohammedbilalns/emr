import type { AuthUser } from "@emr/shared";
import axios, {
	type AxiosError,
	type AxiosRequestConfig,
	type InternalAxiosRequestConfig,
} from "axios";
import { normalizeError } from "./api-errors";
import { tokenManager } from "./token-manager";

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
	_retry?: boolean;
}

interface QueuedRequest {
	resolve: (token: string) => void;
	reject: (error: unknown) => void;
}

let isRefreshing = false;
let failedQueue: QueuedRequest[] = [];

/**
 * Resolves or rejects requests that were queued while refreshing the access token.
 */
function processQueue(
	error: unknown | null,
	token: string | null = null,
): void {
	for (const queued of failedQueue) {
		if (error) {
			queued.reject(error);
		} else if (token) {
			queued.resolve(token);
		}
	}
	failedQueue = [];
}

/**
 * Pre-configured Axios instance for EMR API endpoints with credentials and automatic token refresh.
 */
export const apiClient = axios.create({
	baseURL: "/api/v1",
	withCredentials: true,
	headers: {
		"Content-Type": "application/json",
	},
});

apiClient.interceptors.request.use(
	(config: InternalAxiosRequestConfig) => {
		// Attach the current in-memory access token to outgoing requests
		const token = tokenManager.getToken();
		if (token) {
			config.headers.set("Authorization", `Bearer ${token}`);
		}
		return config;
	},
	(error: unknown) => Promise.reject(normalizeError(error)),
);

apiClient.interceptors.response.use(
	(response) => response,
	async (error: AxiosError) => {
		const originalRequest = error.config as
			| CustomAxiosRequestConfig
			| undefined;

		if (!originalRequest) {
			return Promise.reject(normalizeError(error));
		}

		const status = error.response?.status;
		const url = originalRequest.url || "";

		// Avoid infinite loops by not attempting to refresh auth endpoints
		const isAuthEndpoint =
			url.includes("/auth/login") ||
			url.includes("/auth/refresh") ||
			url.includes("/auth/logout");

		if (status === 401 && !originalRequest._retry && !isAuthEndpoint) {
			// Queue concurrent requests while a token refresh is already in-flight
			if (isRefreshing) {
				return new Promise<string>((resolve, reject) => {
					failedQueue.push({ resolve, reject });
				})
					.then((newToken) => {
						originalRequest.headers.set("Authorization", `Bearer ${newToken}`);
						return apiClient(originalRequest as AxiosRequestConfig);
					})
					.catch((err) => Promise.reject(normalizeError(err)));
			}

			originalRequest._retry = true;
			isRefreshing = true;

			try {
				const refreshResponse = await axios.post<{
					success: boolean;
					data: { accessToken: string; user: AuthUser };
				}>("/api/v1/auth/refresh", {}, { withCredentials: true });

				const newToken = refreshResponse.data.data.accessToken;
				tokenManager.setToken(newToken);

				processQueue(null, newToken);

				originalRequest.headers.set("Authorization", `Bearer ${newToken}`);
				return apiClient(originalRequest as AxiosRequestConfig);
			} catch (refreshErr) {
				processQueue(refreshErr, null);
				tokenManager.clearToken();
				// Broadcast session expiration so AuthContext can clean up user state
				if (typeof window !== "undefined") {
					window.dispatchEvent(new CustomEvent("emr:auth:expired"));
				}
				return Promise.reject(normalizeError(refreshErr));
			} finally {
				isRefreshing = false;
			}
		}

		return Promise.reject(normalizeError(error));
	},
);
