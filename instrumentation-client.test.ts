import * as Sentry from '@sentry/nextjs';

vi.mock('@sentry/nextjs', () => ({
  captureRouterTransitionStart: vi.fn(),
  init: vi.fn(),
}));

describe('instrumentation-client', () => {
  it('should start Sentry with the redaction hooks and no Session Replay when Next.js loads the file', async () => {
    await import('./instrumentation-client');

    expect(Sentry.init).toHaveBeenCalledOnce();

    const [options] = vi.mocked(Sentry.init).mock.calls[0];

    expect(options).toEqual(
      expect.objectContaining({
        beforeBreadcrumb: expect.any(Function),
        beforeSend: expect.any(Function),
        beforeSendSpan: expect.any(Function),
        beforeSendTransaction: expect.any(Function),
      }),
    );
    expect(options).not.toHaveProperty('integrations');
    expect(options).not.toHaveProperty('replaysSessionSampleRate');
    expect(options).not.toHaveProperty('replaysOnErrorSampleRate');
  });
});
