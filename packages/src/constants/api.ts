export interface PaginationMeta {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}
export type ApiSuccess<T = undefined> = [T] extends [undefined]
	? {
			success: true;
			message: string;
			data?: undefined;
			meta?: PaginationMeta;
		}
	: {
			success: true;
			message: string;
			data: T;
			meta?: PaginationMeta;
		};

export interface ApiError {
	success: false;
	message: string;
	errors?: { path: string; message: string }[];
}
