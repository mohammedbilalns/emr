import type {
	ApiSuccess,
	AppointmentDto,
	AppointmentListQuery,
	PaginationMeta,
	UpdateAppointmentBody,
} from "@emr/shared";
import { apiClient } from "../../../shared/api/axios-client";

export async function listAppointmentsApi(
	query: Partial<AppointmentListQuery> = {},
): Promise<{ items: AppointmentDto[]; meta?: PaginationMeta }> {
	const response = await apiClient.get<ApiSuccess<AppointmentDto[]>>(
		"/appointments",
		{
			params: query,
		},
	);
	return {
		items: response.data.data,
		meta: response.data.meta,
	};
}

export async function getAppointmentApi(id: string): Promise<AppointmentDto> {
	const response = await apiClient.get<ApiSuccess<AppointmentDto>>(
		`/appointments/${id}`,
	);
	return response.data.data;
}

export async function updateAppointmentApi(
	id: string,
	body: UpdateAppointmentBody,
): Promise<AppointmentDto> {
	const response = await apiClient.put<ApiSuccess<AppointmentDto>>(
		`/appointments/${id}`,
		body,
	);
	return response.data.data;
}

export async function cancelAppointmentApi(
	id: string,
): Promise<AppointmentDto> {
	const response = await apiClient.delete<ApiSuccess<AppointmentDto>>(
		`/appointments/${id}`,
	);
	return response.data.data;
}

export async function markArrivedApi(id: string): Promise<AppointmentDto> {
	const response = await apiClient.post<ApiSuccess<AppointmentDto>>(
		`/appointments/${id}/arrive`,
	);
	return response.data.data;
}

export async function completeAppointmentApi(
	id: string,
): Promise<AppointmentDto> {
	const response = await apiClient.post<ApiSuccess<AppointmentDto>>(
		`/appointments/${id}/complete`,
	);
	return response.data.data;
}
