import type { ApiSuccess, CreateStaffBody, StaffDto } from "@emr/shared";
import { apiClient } from "../../../shared/api/axios-client";

export async function listStaffApi(): Promise<StaffDto[]> {
	const response = await apiClient.get<ApiSuccess<StaffDto[]>>(
		"/staff/receptionists",
	);
	return response.data.data;
}

export async function createReceptionistApi(
	data: CreateStaffBody,
): Promise<{ id: string; name: string; email: string; role: string }> {
	const response = await apiClient.post<
		ApiSuccess<{ id: string; name: string; email: string; role: string }>
	>("/staff/receptionists", data);
	return response.data.data;
}
