import * as Sentry from '@sentry/nextjs';

import {
  createSentryRedactionHooks,
  getSiteOrigin,
  serverIntegrationOptions,
} from 'utils/sentryRedaction';

export function register() {
  Sentry.init({
    ...createSentryRedactionHooks(
      getSiteOrigin(process.env.NEXT_PUBLIC_BASE_URL),
    ),

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,

    dsn: 'https://231128c2ea5ad7c5e3b0ad63d10e61e2@o949194.ingest.sentry.io/4505975815208960',

    // The Edge runtime build of `@sentry/nextjs` has no Node.js integrations.
    integrations:
      process.env.NEXT_RUNTIME === 'nodejs'
        ? [
            Sentry.httpIntegration(serverIntegrationOptions.http),
            Sentry.nativeNodeFetchIntegration(
              serverIntegrationOptions.nativeNodeFetch,
            ),
            Sentry.requestDataIntegration(serverIntegrationOptions.requestData),
          ]
        : [],

    // Send no `sentry-trace` or `baggage` header to Podcast Index or to a feed host. The `baggage`
    // header holds the transaction name.
    tracePropagationTargets: [],

    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: 1,
  });
}

export const onRequestError = Sentry.captureRequestError;
