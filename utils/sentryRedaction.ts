import type * as Sentry from '@sentry/nextjs';

import { redactSentryData } from 'utils/redactFeedPaths';

type SentryOptions = Parameters<typeof Sentry.init>[0];

interface ServerIntegrationOptions {
  http: NonNullable<Parameters<typeof Sentry.httpIntegration>[0]>;
  nativeNodeFetch: NonNullable<
    Parameters<typeof Sentry.nativeNodeFetchIntegration>[0]
  >;
  requestData: NonNullable<Parameters<typeof Sentry.requestDataIntegration>[0]>;
}

const DEFAULT_SITE_ORIGIN = 'https://pod.monster';

// `@sentry/nextjs` copies each request header into a span attribute with this prefix. Some
// headers hold a segment with no `/feeds/` before it, for example `x-now-route-matches` on Vercel
// and `next-router-state-tree`. The walk cannot find such a segment, so the hooks remove the
// attributes.
const REQUEST_HEADER_ATTRIBUTE_PREFIX = 'http.request.header.';

function omitRequestHeaderAttributes<
  TSpanData extends { data?: Record<string, unknown> },
>(spanData: TSpanData): TSpanData {
  if (spanData.data === undefined) {
    return spanData;
  }

  return {
    ...spanData,
    data: Object.fromEntries(
      Object.entries(spanData.data).filter(
        ([key]) => !key.startsWith(REQUEST_HEADER_ATTRIBUTE_PREFIX),
      ),
    ),
  };
}

/**
 * The origin of `baseUrl`, with no trailing slash, or the origin of pod.monster when `baseUrl` is
 * not a URL.
 */
export function getSiteOrigin(baseUrl: string | undefined): string {
  return baseUrl !== undefined && URL.canParse(baseUrl)
    ? new URL(baseUrl).origin
    : DEFAULT_SITE_ORIGIN;
}

/**
 * The Sentry hooks that keep the feed and episode segments of a path, and each absolute URL that
 * is not on `siteOrigin`, out of every event, span, and breadcrumb.
 */
export function createSentryRedactionHooks(
  siteOrigin: string,
): Required<
  Pick<
    SentryOptions,
    | 'beforeBreadcrumb'
    | 'beforeSend'
    | 'beforeSendSpan'
    | 'beforeSendTransaction'
  >
> {
  return {
    beforeBreadcrumb: (breadcrumb) => redactSentryData(breadcrumb, siteOrigin),
    beforeSend: (event) => redactSentryData(event, siteOrigin),
    beforeSendSpan: (span) =>
      omitRequestHeaderAttributes(redactSentryData(span, siteOrigin)),
    beforeSendTransaction: (event) => {
      const redactedEvent = redactSentryData(event, siteOrigin);
      const { contexts, spans } = redactedEvent;

      // Sentry merges the result of `beforeSendSpan` for the root span into the event. The merge
      // keeps each key that the hook removed, so this hook removes the keys again.
      return {
        ...redactedEvent,
        ...(contexts?.trace !== undefined && {
          contexts: {
            ...contexts,
            trace: omitRequestHeaderAttributes(contexts.trace),
          },
        }),
        ...(spans !== undefined && {
          spans: spans.map(omitRequestHeaderAttributes),
        }),
      };
    },
  };
}

// The `Http` integration of `@sentry/nextjs` sets `disableIncomingRequestSpans`, because Next.js
// makes its own spans for incoming requests. This instance replaces that integration, so it sets
// the option again.
export const serverIntegrationOptions: ServerIntegrationOptions = {
  http: {
    disableIncomingRequestSpans: true,
    ignoreOutgoingRequests: () => true,
  },
  nativeNodeFetch: { ignoreOutgoingRequests: () => true },
  requestData: {
    include: {
      cookies: false,
      data: false,
      headers: false,
      ip: false,
      query_string: false,
      url: false,
    },
  },
};
