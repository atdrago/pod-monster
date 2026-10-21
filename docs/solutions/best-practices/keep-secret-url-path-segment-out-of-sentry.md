---
title: Keep a secret URL path segment out of Sentry and Vercel Insights in Next.js
date: 2026-10-19
category: best-practices
module: Sentry telemetry redaction (utils/sentryRedaction.ts, instrumentation.ts, instrumentation-client.ts)
problem_type: best_practice
component: observability
severity: high
applies_when:
  - 'A URL path segment holds a secret, such as a base64url feed URL with a member token under /feeds/<segment>'
  - 'The app uses @sentry/nextjs 10.x on the Next.js App Router, deployed on Vercel'
  - 'Sentry tracing is on and a path-prefix regex is the only redaction'
  - 'Someone proposes Session Replay for a page that shows secret URLs'
related_components: [api_layer, frontend]
retire_when: 'A @sentry/nextjs release changes the requestDataIntegration defaults (the TODO(v11) in @sentry/core) or stops copying request headers into span attributes; check the Sentry changelog and run npx vitest run --project node utils/sentryRedaction.node.test.ts'
tags:
  [
    sentry,
    nextjs,
    redaction,
    privacy,
    tracing,
    session-replay,
    secrets-in-url,
    vercel-analytics,
  ]
---

# Keep a secret URL path segment out of Sentry and Vercel Insights in Next.js

## Context

The `/feeds/<segment>` pages of the site put a feed URL in the path. The segment is the base64url form of the feed URL, and a private feed URL holds a member token (`utils/redactFeedPaths.ts:13-17`). Thus the segment is a secret. The plan requires that the site keeps it out of its server logs, Sentry, Vercel Analytics, and Speed Insights (R12, `docs/plans/2026-10-18-2030-feat-support-native-urls-plan.md:90`).

The stack is `next` 16.0.7 and `@sentry/nextjs` 10.27.0 (`package.json:20`, `package.json:31`). The installed `@sentry/core`, `@sentry/node`, `@sentry/node-core`, `@sentry/opentelemetry`, `@sentry/vercel-edge`, and `@sentry-internal/replay` are also 10.27.0. The installed `@vercel/analytics` is 1.5.0, and `@vercel/speed-insights` is 1.2.0.

The first layer is a text walk. `redactSentryData` copies an event and sends every string and every object key through `redactFeedPaths` (`utils/redactFeedPaths.ts:107-113`). `redactFeedPaths` replaces each `/feeds/` and `/episodes/` segment with its route name, and replaces the value of each `url` and `feedurl` query parameter (`utils/redactFeedPaths.ts:18-23`). The walk also cuts each absolute URL that is not on the site origin to its origin (`utils/redactFeedPaths.ts:28-39`). The four Sentry hooks apply the walk (`utils/sentryRedaction.ts:54-90`).

The walk alone is not enough. The SDK puts the segment in fields where no `/feeds/` comes before it. It also sends some payloads that never go through the hooks. Each point below names one such path and the setting that closes it.

## Guidance

Use two layers:

1. Turn off each source of data that the site does not need.
2. Scrub the data that is left with the walk over every string.

Then prove the result with a real Sentry client and a test transport.

### 1. Remove every `http.request.header.*` attribute from spans

`@sentry/nextjs` copies the incoming request headers into attributes of the root span. On each `spanStart` of a root span, it calls `addHeadersAsAttributes` with the headers of the isolation scope (`node_modules/@sentry/nextjs/build/esm/server/index.js:191-194`). The Edge build does the same (`node_modules/@sentry/nextjs/build/esm/edge/index.js:96`). The helper `httpHeadersToSpanAttributes` names each attribute `http.request.header.<name>`, with dashes changed to underscores (`node_modules/@sentry/core/build/esm/utils/request.js:138-166`, key at `:151`). It replaces the value with `[Filtered]` only when the name holds a part such as `auth`, `token`, `secret`, `cookie`, or `key` (`node_modules/@sentry/core/build/esm/utils/request.js:117-129`, `:153-154`).

Two headers hold the raw segment with no `/feeds/` before it:

- `x-now-route-matches`. Vercel sends it, and Next.js reads it (`node_modules/next/dist/server/base-server.js:757`). The value has the form `nxtPfeedUrlBase64=<segment>`. The `nxtP` prefix is `NEXT_QUERY_PARAM_PREFIX` (`node_modules/next/dist/lib/constants.js:254`).
- `next-router-state-tree` (`node_modules/next/dist/client/components/app-router-headers.js:93`). The value is the URL-encoded router tree. It holds `["feedUrlBase64","<segment>","d"]` (fixture at `utils/sentryRedaction.node.test.ts:93-103`).

The path pattern needs `/feeds/` (`utils/redactFeedPaths.ts:3`), so it cannot find these values. Neither header name matches the sensitive list. Remove each attribute by its prefix:

```ts
// utils/sentryRedaction.ts:21-38
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
```

Apply it in `beforeSendSpan`. Apply it again to `contexts.trace` and to each item of `spans` in `beforeSendTransaction` (`utils/sentryRedaction.ts:68-88`):

```ts
// utils/sentryRedaction.ts:68-88
beforeSendSpan: (span) =>
  omitRequestHeaderAttributes(redactSentryData(span, siteOrigin)),
beforeSendTransaction: (event) => {
  const redactedEvent = redactSentryData(event, siteOrigin);
  const { contexts, spans } = redactedEvent;

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
```

Remove the full prefix, not a list of header names. A new proxy header or a new Next.js header can hold the segment too.

Per this session, a control run with no strip showed the header attribute and the segment in the sent transaction. A probe in this session confirmed the same result. With the strip, the envelope held neither.

About the second strip: in 10.27.0, Sentry folds the `beforeSendSpan` result for the root span into the event with `merge` (`node_modules/@sentry/core/build/esm/client.js:1007-1015`). The default depth of `merge` is two (`node_modules/@sentry/core/build/esm/utils/merge.js:8-13`), so `contexts.trace` is replaced as a whole. A probe in this session with only the `beforeSendSpan` strip sent no header key. Keep the second strip anyway. It costs little, and it does not depend on how the SDK merges the root span, so an SDK change cannot undo it.

### 2. Turn off every field of `requestDataIntegration` on the server

`requestDataIntegration` copies the request into `event.request`. Its default includes `cookies`, `data`, `headers`, `query_string`, and `url` (`node_modules/@sentry/core/build/esm/integrations/requestdata.js:6-12`). Only `ip` follows `sendDefaultPii` (`node_modules/@sentry/core/build/esm/integrations/requestdata.js:28-31`). The Node SDK adds the integration with no options (`node_modules/@sentry/node-core/build/esm/sdk/index.js:34`). Thus `sendDefaultPii: false` does not keep the URL or the headers out of the event. The source has a `TODO(v11)` to change this default (`node_modules/@sentry/core/build/esm/integrations/requestdata.js:5`).

A probe in this session left `sendDefaultPii` unset. The error event held `request.url`, `request.query_string`, `request.cookies`, and the `x-now-route-matches` header. With every field off, the event held only `{"method":"GET"}`.

```ts
// utils/sentryRedaction.ts:101-110
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
```

`instrumentation.ts:21-30` adds this instance only when `NEXT_RUNTIME` is `nodejs`. The Edge SDK adds `requestDataIntegration` only when `sendDefaultPii` is true (`node_modules/@sentry/vercel-edge/build/esm/index.js:4975`).

A user instance of an integration replaces the default instance with the same name (`node_modules/@sentry/core/build/esm/integration.js:15-33`). The replacement does not keep the options of the default instance. `@sentry/nextjs` builds its default `Http` integration with `disableIncomingRequestSpans: true` (`node_modules/@sentry/nextjs/build/esm/server/index.js:86-93`). Thus the replacement must set that option again (`utils/sentryRedaction.ts:92-98`).

### 3. Remove Session Replay

Do not add Session Replay to a site with a secret in the URL. The hooks of this guide do not run on a replay:

- The Sentry client runs `beforeSend` only for an event with no `type`, and `beforeSendTransaction` only for a `transaction` (`node_modules/@sentry/core/build/esm/client.js:990-994`, `:1070-1076`).
- Replay builds a `replay_event` and calls `prepareEvent` itself (`node_modules/@sentry-internal/replay/build/npm/esm/index.js:8091-8124`). Then it calls `transport.send` directly (`node_modules/@sentry-internal/replay/build/npm/esm/index.js:8235-8240`).
- The `urls` field of the replay event holds the full page URL, with the query, for the first page and for each navigation (`node_modules/@sentry-internal/replay/build/npm/esm/index.js:9085-9097`, `:6880-6881`, `:8174-8184`).
- The recording makes each `href` absolute (`node_modules/@sentry-internal/replay/build/npm/esm/index.js:510-516`). `maskAllText` masks only the attributes in `maskAttributes`, plus the value of a button-type input, and the default list is `['title', 'placeholder', 'aria-label']` (`node_modules/@sentry-internal/replay/build/npm/esm/index.js:9703-9731`, `:9804`). Thus a link to `/feeds/<segment>` goes out as it is.

Plan KTD8 removed Replay for the whole site (`docs/plans/2026-10-18-2030-feat-support-native-urls-plan.md:263`). The client init file records the reason:

```ts
// instrumentation-client.ts:12-13
// Do not add Session Replay. Replay events skip the redaction hooks, and `maskAllText` does not
// mask the `href` of a link, so a replay can hold a feed URL.
```

### 4. Ignore every outgoing request on the server, and send no trace headers

The server fetches the feed URL itself, and it calls Podcast Index with the feed URL in a `?url=` query. The default instrumentation records each such request in two places:

- An `http.client` span. The OpenTelemetry `undici` instrumentation sets `url.full`, `url.path`, and `url.query` (`node_modules/@opentelemetry/instrumentation-undici/build/src/undici.js:177-179`, version 0.19.0).
- A breadcrumb with category `http`. The `url` field keeps the full path, and `http.query` keeps the query (`node_modules/@sentry/node-core/build/esm/integrations/node-fetch/SentryNodeFetchInstrumentation.js:245-260`). `getSanitizedUrlString` removes only the credentials and a default port (`node_modules/@sentry/core/build/esm/utils/url.js:218-231`). The `node:http` path does the same (`node_modules/@sentry/node-core/build/esm/integrations/http/outgoing-requests.js:90-107`).

The walk cuts a URL that is not on the site origin to its origin. But the walk knows only the `url` and `feedurl` query names. A record that the SDK never makes is safer than a scrub of a record. Thus ignore all outgoing requests in both integrations:

```ts
// utils/sentryRedaction.ts:95-100
export const serverIntegrationOptions: ServerIntegrationOptions = {
  http: {
    disableIncomingRequestSpans: true,
    ignoreOutgoingRequests: () => true,
  },
  nativeNodeFetch: { ignoreOutgoingRequests: () => true },
```

The `fetch` instrumentation returns early for an ignored request (`node_modules/@sentry/node-core/build/esm/integrations/node-fetch/SentryNodeFetchInstrumentation.js:87-94`). Then it adds no breadcrumb (`:168-170`) and no trace header (`:102-103`). The `Http` integration passes the same hook to its breadcrumb instrumentation and to its OpenTelemetry instrumentation (`node_modules/@sentry/node/build/esm/integrations/http.js:105-112`, `:128-143`). The `nativeNodeFetchIntegration` passes it to the span instrumentation (`node_modules/@sentry/node/build/esm/integrations/node-fetch.js:67-76`).

Also set `tracePropagationTargets` to `[]` (`instrumentation.ts:32-34`). With no value, the SDK adds `sentry-trace` and `baggage` to every outgoing request (`node_modules/@sentry/opentelemetry/build/esm/index.js:777-779`). An empty list matches no URL (`:787`). The `baggage` header holds the transaction name when the name source is not `url` (`node_modules/@sentry/core/build/esm/tracing/dynamicSamplingContext.js:109-116`). Thus a feed host or Podcast Index can receive the name.

### 5. Prove the result with a real Sentry client and a test transport

Hook unit tests check only the shapes that you know about. The leak of point 1 came from a field that the SDK adds inside the client. Thus the main proof is `utils/sentryRedaction.node.test.ts`. It does these steps:

1. Start a real server client with the same hooks and integration options as `instrumentation.ts` (`utils/sentryRedaction.node.test.ts:56-68`).
2. Give it a transport from `Sentry.createTransport` that records each envelope as text (`utils/sentryRedaction.node.test.ts:69-76`).
3. Put a `normalizedRequest` with the two leak headers, a `/feeds/` URL, and a query on the isolation scope (`utils/sentryRedaction.node.test.ts:89-110`).
4. Start an `http.server` span with a raw segment in its name, then add a breadcrumb and capture an error (`utils/sentryRedaction.node.test.ts:112-134`).
5. Flush, then search all of the sent text for the segment, the guid, and the token (`utils/sentryRedaction.node.test.ts:137-145`).

```ts
// utils/sentryRedaction.node.test.ts:139-145
const allSentData = sentEnvelopes
  .map(({ serialized }) => serialized)
  .join('\n');

expect(allSentData).not.toContain(FEED_SEGMENT);
expect(allSentData).not.toContain(GUID_SEGMENT);
expect(allSentData).not.toContain('secret-member-token');
```

A search of the full serialized envelope also covers the envelope headers. The `trace` header comes from `sdkProcessingMetadata.dynamicSamplingContext` (`node_modules/@sentry/core/build/esm/utils/envelope.js:232-245`). The walk visits that object, so the test can assert a redacted transaction name in it (`utils/sentryRedaction.node.test.ts:150-152`). A second test fetches from a local server and asserts no `http.client` span and no `http` breadcrumb (`utils/sentryRedaction.node.test.ts:196-235`).

The Vitest `node` project runs only `*.node.test.ts` files, and the browser project excludes them (`vitest.config.mts:29`, `vitest.config.mts:45-61`). Run the proof with `npx vitest run --project node utils/sentryRedaction.node.test.ts`. Run the hook unit tests with `npx vitest run utils/sentryRedaction.test.ts`.

### 6. Scrub Vercel Analytics and Speed Insights in `beforeSend`, and know its limit

The `beforeSend` of each package receives only `type` and `url` (`node_modules/@vercel/analytics/dist/index.d.ts:1-12`, `node_modules/@vercel/speed-insights/dist/next/index.d.ts:10-15`). `app/VercelInsights.tsx` removes the query and the fragment, then applies `redactFeedPaths` (`app/VercelInsights.tsx:8-17`):

```tsx
// app/VercelInsights.tsx:10-24
function redactInsightsEvent<TEvent extends Pick<BeforeSendEvent, 'url'>>(
  event: TEvent,
): TEvent {
  return {
    ...event,
    url: redactFeedPaths(event.url.replace(QUERY_AND_FRAGMENT_PATTERN, '')),
  };
}

export const VercelInsights = () => (
  <>
    <SpeedInsights beforeSend={redactInsightsEvent} />
    <Analytics beforeSend={redactInsightsEvent} />
  </>
);
```

The `route` field does not go through `beforeSend`. The `/next` wrappers compute it from `useParams`, `usePathname`, and `useSearchParams` (`node_modules/@vercel/analytics/dist/next/index.mjs:177-187`, `node_modules/@vercel/speed-insights/dist/next/index.mjs:168-178`). Then they give it to the script directly (`node_modules/@vercel/analytics/dist/next/index.mjs:136-142`, `:168-172`; `node_modules/@vercel/speed-insights/dist/next/index.mjs:106-108`). `computeRoute` replaces each parameter value in the path with `[name]` (`node_modules/@vercel/analytics/dist/next/index.mjs:49-76`). Thus a matched route sends `/feeds/[feedUrlBase64]`. Use the `/next` entry of each package, so that the route name stays.

Known limit, from the code review of this branch: on a `/feeds/` path that matches no route, the wrappers get no parameter values. Then `computeRoute` gives back the pathname as it is (`node_modules/@vercel/analytics/dist/next/index.mjs:53-72`), and the raw segment goes out in `route`. The plan gives a fallback: if a preview check finds a segment in a payload field, `beforeSend` returns `null` for every `/feeds/` URL (`docs/plans/2026-10-18-2030-feat-support-native-urls-plan.md:259`). The plan also asks for a Network-tab check of `/_vercel/insights/view` and `/_vercel/speed-insights/vitals` on a preview (`docs/plans/2026-10-18-2030-feat-support-native-urls-plan.md:1024`). The payload shape comes from a remote script, so a local test cannot prove it.

## Why This Matters

A member token in a feed URL gives access to paid content. One leak to Sentry or Vercel puts the token in a third-party store. Each person with access to that project can then read it, and the token stays there until it expires.

Each leak in this guide is a default or an internal detail of the SDK:

- The header attributes come from a hook inside `@sentry/nextjs`. No init option names them.
- `requestDataIntegration` sends the URL and the headers with `sendDefaultPii` off.
- Replay sends its own envelope, so the hooks do not see it.
- The outgoing request records hold the feed URL, which is the secret itself, not its base64url form.

A text scrub finds only the forms that its pattern knows. The segment appears without `/feeds/` in headers, and the feed URL appears as a plain URL in outgoing records. Thus the safe order is: stop the source first, then scrub what is left. A test with a real client finds a new source after an SDK upgrade. A hook unit test does not.

## When to Apply

- A path segment, a query value, or a header of the site holds a secret or a token, and the site uses Sentry or Vercel Insights.
- The site uses `@sentry/nextjs` with the App Router. The header copy of point 1 is in 10.27.0. Check `addHeadersAsAttributes` again on an upgrade.
- The server fetches a URL that the user gives, for example a feed URL or a proxy target.
- Someone proposes Session Replay on a site with a secret in a URL.
- An upgrade to `@sentry/nextjs` v11. The `TODO(v11)` at `node_modules/@sentry/core/build/esm/integrations/requestdata.js:5` can change the defaults of point 2. Run `npx vitest run --project node utils/sentryRedaction.node.test.ts` after each Sentry upgrade.
- The site adds Edge code. Now the site has no `middleware.ts`, no `proxy.ts`, and no `export const runtime` in `app/`. The Edge SDK has its own fetch integration (`node_modules/@sentry/vercel-edge/build/esm/index.js:4972`), and `instrumentation.ts:21-30` adds the Node.js options only for `nodejs`.

A related trap: Next.js does not call a function named `onClientInit`, so a `Sentry.init` inside it never runs. A search of `node_modules/next` (16.0.7) and `node_modules/@sentry` finds no reference to that name. `instrumentation-client.ts` now calls `Sentry.init` at the top level of the file, which Next.js loads in the browser, so the client hooks run. Keep `createSentryRedactionHooks(window.location.origin)` in that call, and keep Replay out. `instrumentation-client.test.ts` checks both.

## Examples

### Before and after: the server init

Before, a common setup for `@sentry/nextjs`:

```ts
// instrumentation.ts (a common setup, not the current file)
export function register() {
  Sentry.init({
    dsn: '...',
    tracesSampleRate: 1,
  });
}
```

This setup sends `x-now-route-matches` and `next-router-state-tree` as root span attributes. It sends `request.url` and `request.headers` on each error. It records each feed fetch as an `http.client` span and an `http` breadcrumb. It adds `baggage` with the transaction name to each outgoing request.

After, the current file:

```ts
// instrumentation.ts:9-39
export function register() {
  Sentry.init({
    ...createSentryRedactionHooks(
      getSiteOrigin(process.env.NEXT_PUBLIC_BASE_URL),
    ),
    // ...
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
    tracePropagationTargets: [],
    tracesSampleRate: 1,
  });
}
```

### Before and after: the client init

Before, a common setup with Replay. Plan U11 removed `replayIntegration` and the two replay sample rates from this file (`docs/plans/2026-10-18-2030-feat-support-native-urls-plan.md:1009`):

```ts
// instrumentation-client.ts (a common setup, not the current file)
Sentry.init({
  dsn: '...',
  integrations: [Sentry.replayIntegration()],
  // replay sample rates
  tracesSampleRate: 1,
});
```

After, the current file has the hooks and no Replay (`instrumentation-client.ts:14-26`):

```ts
Sentry.init({
  ...createSentryRedactionHooks(window.location.origin),
  dsn: '...',
  tracesSampleRate: 1,
});
```

### Probe results from this session

Each probe used a real `@sentry/nextjs` 10.27.0 client in Node 22.18.0 with a transport that recorded the envelopes.

| Source                          | Without the setting                                                                       | With the setting                                       |
| ------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Root span header attributes     | The `http.request.header.x_now_route_matches` key and the segment were in the transaction | Neither was in the envelope                            |
| `requestDataIntegration`        | `request` held `headers`, `url`, `cookies`, and `query_string`                            | `request` was `{"method":"GET"}`                       |
| Outgoing `fetch` to a feed path | The path token, the query, an `http.client` span, and an `http` breadcrumb were sent      | No path, no query, no span, and no breadcrumb was sent |

### A test that catches a new leak

To add a new sink or a new header to the proof, add it to the seeded request or to the span in `utils/sentryRedaction.node.test.ts:89-134`. Then keep the search over the full serialized text. Do not change the test to assert only the fields that you expect. The value of the test is that it also checks the fields that nobody expects.
