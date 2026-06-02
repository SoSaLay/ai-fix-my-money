export interface ApiSuccess<T = unknown> {
  data: T
  meta?: { total?: number; page?: number; limit?: number }
}

export interface ApiError {
  error: string
  message?: string
  code?: string
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError
