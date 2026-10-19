import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import * as Sentry from '@sentry/nextjs';

import {
  createSentryRedactionHooks,
  serverIntegrationOptions,
} from './sentryRedaction';

const SITE_ORIGIN = 'https://pod.monster';
const FEED_URL = 'https://members.example.com/feed/secret-member-token';
const FEED_SEGMENT = Buffer.from(FEED_URL).toString('base64url');
const GUID_SEGMENT = Buffer.from('episode-guid-1').toString('base64url');
const PODCAST_INDEX_URL =
  'https://api.podcastindex.org/api/1.0/podcasts/byfeedurl?url=x';

interface SentEnvelope {
  headers: Record<string, any>;
  items: Array<{ headers: Record<string, any>; payload: Record<string, any> }>;
  serialized: string;
}

const sentEnvelopes: Array<SentEnvelope> = [];

function parseEnvelope(body: string | Uint8Array): SentEnvelope {
  const serialized =
    typeof body === 'string' ? body : new TextDecoder().decode(body);
  const [headerLine, ...itemLines] = serialized
    .split('\n')
    .filter((line) => line !== '');
  const items: SentEnvelope['items'] = [];

  for (let i = 0; i < itemLines.length; i += 2) {
    items.push({
      headers: JSON.parse(itemLines[i]),
      payload: JSON.parse(itemLines[i + 1]),
    });
  }

  return { headers: JSON.parse(headerLine), items, serialized };
}

function findEnvelope(itemType: string): SentEnvelope {
  const envelope = sentEnvelopes.find(({ items }) =>
    items.some(({ headers }) => headers.type === itemType),
  );

  if (envelope === undefined) {
    throw new Error(`No envelope with an item of type ${itemType}`);
  }

  return envelope;
}

describe('sentryRedaction', () => {
  beforeAll(() => {
    Sentry.init({
      ...createSentryRedactionHooks(SITE_ORIGIN),
      dsn: 'https://public@o0.ingest.sentry.io/0',
      integrations: [
        Sentry.httpIntegration(serverIntegrationOptions.http),
        Sentry.nativeNodeFetchIntegration(
          serverIntegrationOptions.nativeNodeFetch,
        ),
        Sentry.requestDataIntegration(serverIntegrationOptions.requestData),
      ],
      tracePropagationTargets: [],
      tracesSampleRate: 1,
      transport: (
        transportOptions: Parameters<typeof Sentry.createTransport>[0],
      ) =>
        Sentry.createTransport(transportOptions, async (request) => {
          sentEnvelopes.push(parseEnvelope(request.body));

          return { statusCode: 200 };
        }),
    });
  });

  beforeEach(() => {
    sentEnvelopes.length = 0;
  });

  afterAll(async () => {
    await Sentry.close();
  });

  it('should send no feed segment in the event, the envelope headers, or the trace context', async () => {
    Sentry.withIsolationScope((isolationScope) => {
      isolationScope.setSDKProcessingMetadata({
        normalizedRequest: {
          headers: {
            'next-router-state-tree': encodeURIComponent(
              JSON.stringify([
                '',
                {
                  children: [
                    'feeds',
                    { children: [['feedUrlBase64', FEED_SEGMENT, 'd'], {}] },
                  ],
                },
              ]),
            ),
            'x-now-route-matches': `nxtPfeedUrlBase64=${FEED_SEGMENT}&nxtPguidBase64=${GUID_SEGMENT}`,
          },
          method: 'GET',
          query_string: 't=10',
          url: `${SITE_ORIGIN}/feeds/${FEED_SEGMENT}/episodes/${GUID_SEGMENT}?t=10`,
        },
      });

      Sentry.startSpan(
        {
          attributes: {
            [Sentry.SEMANTIC_ATTRIBUTE_SENTRY_SOURCE]: 'route',
            'url.full': `${SITE_ORIGIN}/feeds/${FEED_SEGMENT}/episodes/${GUID_SEGMENT}?t=10`,
          },
          name: `GET /feeds/${FEED_SEGMENT}/episodes/${GUID_SEGMENT}`,
          op: 'http.server',
        },
        () => {
          Sentry.addBreadcrumb({
            category: 'fetch',
            data: {
              url: `${SITE_ORIGIN}/api/podcasts/chapters?url=${encodeURIComponent(FEED_URL)}`,
            },
          });
          Sentry.captureException(
            new Error(
              `Failed to render /feeds/${FEED_SEGMENT}/episodes/${GUID_SEGMENT} from ${FEED_URL}`,
            ),
          );
        },
      );
    });

    await Sentry.flush(5000);

    const allSentData = sentEnvelopes
      .map(({ serialized }) => serialized)
      .join('\n');

    expect(allSentData).not.toContain(FEED_SEGMENT);
    expect(allSentData).not.toContain(GUID_SEGMENT);
    expect(allSentData).not.toContain('secret-member-token');

    const errorEnvelope = findEnvelope('event');
    const errorEvent = errorEnvelope.items[0].payload;

    expect(errorEnvelope.headers.trace.transaction).toBe(
      'GET /feeds/[feedUrlBase64]/episodes/[guidBase64]',
    );
    expect(errorEvent.exception.values[0].value).toBe(
      'Failed to render /feeds/[feedUrlBase64]/episodes/[guidBase64] from https://members.example.com',
    );
    expect(errorEvent.request).toEqual({ method: 'GET' });
    expect(errorEvent.breadcrumbs).toContainEqual(
      expect.objectContaining({
        data: { url: `${SITE_ORIGIN}/api/podcasts/chapters?url=[redacted]` },
      }),
    );

    const transactionEnvelope = findEnvelope('transaction');
    const transactionEvent = transactionEnvelope.items[0].payload;

    expect(transactionEnvelope.headers.trace.transaction).toBe(
      'GET /feeds/[feedUrlBase64]/episodes/[guidBase64]',
    );
    expect(transactionEvent.transaction).toBe(
      'GET /feeds/[feedUrlBase64]/episodes/[guidBase64]',
    );
    expect(transactionEvent.contexts.trace.data['url.full']).toBe(
      `${SITE_ORIGIN}/feeds/[feedUrlBase64]/episodes/[guidBase64]?t=10`,
    );
    expect(
      Object.keys(transactionEvent.contexts.trace.data).filter((key) =>
        key.startsWith('http.request.header.'),
      ),
    ).toEqual([]);
  });

  it('should ignore an outgoing request to Podcast Index', () => {
    expect(
      serverIntegrationOptions.http.ignoreOutgoingRequests?.(
        PODCAST_INDEX_URL,
        {},
      ),
    ).toBe(true);
    expect(
      serverIntegrationOptions.nativeNodeFetch.ignoreOutgoingRequests?.(
        PODCAST_INDEX_URL,
      ),
    ).toBe(true);
  });

  it('should send no span and no breadcrumb for an outgoing fetch', async () => {
    const server = createServer((_request, response) => {
      response.end('{}');
    });

    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', resolve);
    });

    const { port } = server.address() as AddressInfo;

    await Sentry.withIsolationScope(() =>
      Sentry.startSpan(
        { name: 'outgoing fetch test', op: 'test' },
        async () => {
          const response = await fetch(
            `http://127.0.0.1:${port}/api/1.0/podcasts/byfeedurl?url=x`,
          );

          await response.text();
          Sentry.captureMessage('outgoing fetch test');
        },
      ),
    );
    await Sentry.flush(5000);
    server.closeAllConnections();
    server.close();

    const messageEvent = findEnvelope('event').items[0].payload;
    const transactionEvent = findEnvelope('transaction').items[0].payload;

    expect(messageEvent.message).toBe('outgoing fetch test');
    expect(messageEvent.breadcrumbs ?? []).not.toContainEqual(
      expect.objectContaining({ category: 'http' }),
    );
    expect(transactionEvent.transaction).toBe('outgoing fetch test');
    expect(transactionEvent.spans).not.toContainEqual(
      expect.objectContaining({ op: 'http.client' }),
    );
  });
});
