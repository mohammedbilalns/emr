import type { ApiSuccess, AuthUser, LoginBody } from "@emr/shared";
import { apiClient } from "./axios-client";

export async function loginApi(
	data: LoginBody,
): Promise<{ user: AuthUser; accessToken: string }> {
	const response = await apiClient.post<
		ApiSuccess<{ user: AuthUser; accessToken: string }>
	>("/auth/login", data);
	return response.data.data;
}

export async function logoutApi(): Promise<void> {
	await apiClient.post("/auth/logout");
}

export async function refreshApi(): Promise<{
	user: AuthUser;
	accessToken: string;
}> {
	const response =
		await apiClient.post<ApiSuccess<{ user: AuthUser; accessToken: string }>>(
			"/auth/refresh",
		);
	return response.data.data;
}

export async function meApi(): Promise<AuthUser> {
	const response = await apiClient.get<ApiSuccess<AuthUser>>("/auth/me");
	return response.data.data;
}
