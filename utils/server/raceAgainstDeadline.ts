import 'server-only';

/**
 * Races an operation against a timeout, clears the timer, and handles a late
 * rejection of the losing operation.
 *
 * The operation does not stop when the deadline wins, because a promise cannot
 * be canceled. A caller that must stop the work gives it an `AbortSignal`.
 */
export async function raceAgainstDeadline<TValue>(
  operation: Promise<TValue>,
  timeoutMilliseconds: number,
  createTimeoutError: () => Error,
): Promise<TValue> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const deadline = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      reject(createTimeoutError());
    }, timeoutMilliseconds);
  });

  try {
    return await Promise.race([operation, deadline]);
  } finally {
    clearTimeout(timer);
    // The caller already received this rejection through the race, or the
    // timeout error before it. Without a handler, a late rejection becomes an
    // unhandled rejection.
    operation.catch(() => {});
  }
}
