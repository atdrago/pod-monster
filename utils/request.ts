import type { ApiErrorResponse } from 'utils/createApiErrorResponse';

const GENERAL_ERROR_MESSAGE = 'Something went wrong. Please try again later.';

/**
 * The chapters and transcript proxies send a fixed error code with no message,
 * so that no detail of the target URL reaches the browser. The page shows
 * these messages for the codes instead. A code for a bad request of the page
 * itself gets the general message.
 */
const PROXY_ERROR_MESSAGES = new Map<string, string>([
  ['blocked', "We can't load files from this address."],
  [
    'http_status',
    "The podcast's server sent an error. Please try again later.",
  ],
  ['invalid_body', "We couldn't read this file."],
  [
    'network',
    "We couldn't reach the podcast's server. Please try again later.",
  ],
  [
    'timeout',
    "The podcast's server took too long to respond. Please try again later.",
  ],
  ['too_large', 'This file is too large for us to load.'],
  ['unsupported_type', "We can't show this transcript format."],
]);

const getErrorMessage = (error: unknown): string => {
  if (typeof error === 'object' && error !== null) {
    if ('message' in error && typeof error.message === 'string') {
      return error.message;
    }

    if ('code' in error && typeof error.code === 'string') {
      return PROXY_ERROR_MESSAGES.get(error.code) ?? GENERAL_ERROR_MESSAGE;
    }
  }

  return GENERAL_ERROR_MESSAGE;
};

/**
 * Generic method that handles errors from the API and properly throws them.
 * This function should be used in any fetcher functions that get passed to
 * react-query. It has the same parameters as `fetch`.
 * @link https://fetch.spec.whatwg.org/#fetch-method
 */
export async function request<TResponse = unknown>(
  input: RequestInfo,
  init?: RequestInit,
): Promise<TResponse> {
  const response = await fetch(input, init);

  const responseJson: ApiErrorResponse | TResponse = await response.json();

  const isErrorResponse =
    responseJson && typeof responseJson === 'object' && 'error' in responseJson;

  if (!response.ok || isErrorResponse) {
    if (isErrorResponse) {
      throw new Error(getErrorMessage(responseJson.error));
    }

    // An HTTP/2 response has no status text.
    throw new Error(response.statusText || GENERAL_ERROR_MESSAGE);
  }

  return responseJson;
}
