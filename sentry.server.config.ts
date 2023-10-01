// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  dsn: 'https://231128c2ea5ad7c5e3b0ad63d10e61e2@o949194.ingest.sentry.io/4505975815208960',

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1,
});
