import type { IApiErrorResponse } from 'types';

/**
 * Takes an error parameter and returns an object with `message`, `name`, and
 * `stack` properties. `name` and `stack` can both be `null`, but `message` will
 * always be a string, with the default message 'Unknown error occurred.'
 * @param error Can be anything, but specifically handles strings and Error
 * instances
 */
export const createApiErrorResponse = (
  error: unknown | string | Error
): IApiErrorResponse => {
  const errorResponse: IApiErrorResponse = {
    error: {
      message: 'Unknown error occurred.',
      name: null,
      stack: null,
    },
  };

  if (typeof error === 'string') {
    errorResponse.error.message = error;
  } else if (error instanceof Error) {
    errorResponse.error = {
      message: error.message,
      name: error.name,
      stack: error.stack ?? null,
    };
  }

  return errorResponse;
};
