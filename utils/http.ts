export class NetworkError extends Error {
  name = 'NetworkError';

  constructor(message: string, public response: Response) {
    super(message);
  }
}

/**
 * Generic method that handles all HTTP methods and allows to pass expected return type.
 * The latter is useful since `fetch()` method does not support generic type variables.
 * @param {string} url - endpoint URL
 * @param {[RequestInit]} config - request configuration
 * @link https://fetch.spec.whatwg.org/#fetch-method
 */
export async function http<TResponse>(
  url: string,
  config: RequestInit
): Promise<TResponse> {
  const response = await fetch(url, config);

  if (!response.ok) {
    throw new NetworkError(
      `Network response was not ok for "${url}"`,
      response
    );
  }

  const data = await response.json();

  return data as TResponse;
}
