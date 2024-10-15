type Nullable<T> = T | null;

interface ApiError {
  message: string;
  name: Nullable<string>;
  stack: Nullable<string>;
}

export interface ApiErrorResponse {
  error: ApiError;
}
