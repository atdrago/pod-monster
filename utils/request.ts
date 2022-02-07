import type { IApiErrorResponse } from 'types';

/**
 * Generic method that handles errors from the API and properly throws them.
 * This function should be used in any fetcher functions that get passed to
 * react-query. It has the same parameters as `fetch`.
 * @link https://fetch.spec.whatwg.org/#fetch-method
 */
export async function request<TResponse = unknown>(
  input: RequestInfo,
  init?: RequestInit
): Promise<TResponse> {
  const response = await fetch(input, init);

  const responseJson: IApiErrorResponse | TResponse = await response.json();

  const isErrorResponse = 'error' in responseJson;

  if (!response.ok || isErrorResponse) {
    if (isErrorResponse) {
      throw new Error(responseJson.error.message);
    }

    throw new Error(response.statusText);
  }

  return responseJson;
}
