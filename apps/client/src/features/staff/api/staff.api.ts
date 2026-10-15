import type { ApiSuccess, CreateStaffBody } from "@emr/shared";
import { apiClient } from "../../../shared/api/axios-client";

export async function createReceptionistApi(
	data: CreateStaffBody,
): Promise<{ id: string; name: string; email: string; role: string }> {
	const response = await apiClient.post<
		ApiSuccess<{ id: string; name: string; email: string; role: string }>
	>("/staff/receptionists", data);
	return response.data.data;
}
