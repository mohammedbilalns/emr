import type {
	ApiSuccess,
	AppointmentDto,
	CreateAppointmentBody,
	DoctorDto,
	PatientDto,
	SlotDto,
} from "@emr/shared";
import { apiClient } from "../../../shared/api/axios-client";

export async function getSlotsApi(
	doctorId: string,
	date: string,
): Promise<SlotDto[]> {
	const response = await apiClient.get<ApiSuccess<SlotDto[]>>("/slots", {
		params: { doctorId, date },
	});
	return response.data.data;
}

export async function bookAppointmentApi(
	data: CreateAppointmentBody,
): Promise<AppointmentDto> {
	const response = await apiClient.post<ApiSuccess<AppointmentDto>>(
		"/appointments",
		data,
	);
	return response.data.data;
}

export async function searchPatientsApi(q: string): Promise<PatientDto[]> {
	if (!q.trim()) return [];
	const response = await apiClient.get<ApiSuccess<PatientDto[]>>(
		"/patients/search",
		{
			params: { q: q.trim(), limit: 10 },
		},
	);
	return response.data.data;
}

export async function listDoctorsApi(): Promise<DoctorDto[]> {
	const response = await apiClient.get<ApiSuccess<DoctorDto[]>>("/doctors");
	return response.data.data;
}
