type Nullable<T> = T | null;

interface IApiError {
  message: string;
  name: Nullable<string>;
  stack: Nullable<string>;
}

export interface IApiErrorResponse {
  error: IApiError;
}
