import { raceAgainstDeadline } from './raceAgainstDeadline';

describe('raceAgainstDeadline', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('should resolve with the value of the operation when it settles in time', async () => {
    const result = await raceAgainstDeadline(
      Promise.resolve('done'),
      1_000,
      () => new Error('deadline'),
    );

    expect(result).toBe('done');
  });

  it('should pass through the rejection of the operation with no change', async () => {
    const failure = new Error('operation failed');

    await expect(
      raceAgainstDeadline(
        Promise.reject(failure),
        1_000,
        () => new Error('deadline'),
      ),
    ).rejects.toBe(failure);
  });

  it('should reject with the timeout error when the operation never settles', async () => {
    vi.useFakeTimers();

    const deadlineError = new Error('deadline hit');
    const raced = raceAgainstDeadline(
      new Promise<never>(() => {}),
      60_000,
      () => deadlineError,
    );
    const assertion = expect(raced).rejects.toBe(deadlineError);

    await vi.advanceTimersByTimeAsync(60_000);

    await assertion;
  });

  it('should not surface a late rejection from the abandoned operation', async () => {
    vi.useFakeTimers();

    const unhandledRejectionListener = vi.fn();

    process.on('unhandledRejection', unhandledRejectionListener);

    try {
      let rejectLate: (error: Error) => void = () => {};

      const operation = new Promise<never>((_resolve, reject) => {
        rejectLate = reject;
      });
      const raced = raceAgainstDeadline(
        operation,
        60_000,
        () => new Error('deadline'),
      );
      const assertion = expect(raced).rejects.toThrow('deadline');

      await vi.advanceTimersByTimeAsync(60_000);
      await assertion;

      rejectLate(new Error('late failure'));
      await vi.advanceTimersByTimeAsync(0);

      expect(unhandledRejectionListener).not.toHaveBeenCalled();
    } finally {
      process.off('unhandledRejection', unhandledRejectionListener);
    }
  });
});
