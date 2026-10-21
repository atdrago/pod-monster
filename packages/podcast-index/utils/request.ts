const REQUEST_TIMEOUT_MILLISECONDS = 5_000;

/**
 * This error keeps only the endpoint path and the status. The query string can
 * hold a feed URL or a guid, and Next.js prints each property of an uncaught
 * error. Thus, the error keeps no URL, no response, no body text, and no cause.
 */
export class NetworkError extends Error {
  name = 'NetworkError';

  constructor(
    public readonly endpointPath: string,
    public readonly status: number,
  ) {
    super(`(${status}) Unsuccessful response received from "${endpointPath}"`);
  }
}

/**
 * Generic method that handles all HTTP methods and allows to pass expected return type.
 * The latter is useful since `fetch()` method does not support generic type variables.
 * @param {string} url - endpoint URL
 * @param {[RequestInit]} config - request configuration
 * @link https://fetch.spec.whatwg.org/#fetch-method
 */
export async function request<TResponse>(
  url: string,
  config?: RequestInit,
): Promise<TResponse> {
  const response = await fetch(url, {
    ...config,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MILLISECONDS),
  });

  if (!response.ok) {
    // An unread body keeps its connection until garbage collection.
    await response.body?.cancel();

    throw new NetworkError(new URL(url).pathname, response.status);
  }

  const data: TResponse = await response.json();

  return data;
}
