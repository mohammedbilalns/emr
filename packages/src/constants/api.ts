export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number; 
}
export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: { path: string; message: string }[];
}
