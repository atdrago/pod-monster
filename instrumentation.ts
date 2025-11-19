import * as Sentry from '@sentry/nextjs';

export function register() {
  Sentry.init({
    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,

    dsn: 'https://231128c2ea5ad7c5e3b0ad63d10e61e2@o949194.ingest.sentry.io/4505975815208960',

    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: 1,
  });
}

export const onRequestError = Sentry.captureRequestError;
