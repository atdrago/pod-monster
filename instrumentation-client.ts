/* eslint-disable import/no-unused-modules */
// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

import { createSentryRedactionHooks } from 'utils/sentryRedaction';

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

// Do not add Session Replay. Replay events skip the redaction hooks, and `maskAllText` does not
// mask the `href` of a link, so a replay can hold a feed URL.
export function onClientInit() {
  Sentry.init({
    ...createSentryRedactionHooks(window.location.origin),

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,

    dsn: 'https://231128c2ea5ad7c5e3b0ad63d10e61e2@o949194.ingest.sentry.io/4505975815208960',

    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: 1,
  });
}
