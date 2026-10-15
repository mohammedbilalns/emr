import type {
	ApiSuccess,
	CreateDoctorBody,
	DoctorDto,
	UpdateDoctorScheduleBody,
} from "@emr/shared";
import { apiClient } from "../../../shared/api/axios-client";

export async function listDoctorsApi(): Promise<DoctorDto[]> {
	const response = await apiClient.get<ApiSuccess<DoctorDto[]>>("/doctors");
	return response.data.data;
}

export async function createDoctorApi(
	data: CreateDoctorBody,
): Promise<DoctorDto> {
	const response = await apiClient.post<ApiSuccess<DoctorDto>>(
		"/doctors",
		data,
	);
	return response.data.data;
}

export async function updateDoctorScheduleApi(
	id: string,
	data: UpdateDoctorScheduleBody,
): Promise<DoctorDto> {
	const response = await apiClient.put<ApiSuccess<DoctorDto>>(
		`/doctors/${id}`,
		data,
	);
	return response.data.data;
}
