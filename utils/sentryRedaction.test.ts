import { createSentryRedactionHooks, getSiteOrigin } from './sentryRedaction';

type SentryRedactionHooks = ReturnType<typeof createSentryRedactionHooks>;
type ErrorEvent = Parameters<SentryRedactionHooks['beforeSend']>[0];
type TransactionEvent = Parameters<
  SentryRedactionHooks['beforeSendTransaction']
>[0];
type SpanJson = Parameters<SentryRedactionHooks['beforeSendSpan']>[0];

const SITE_ORIGIN = 'https://pod.monster';
const FEED_SEGMENT = 'aHR0cHM6Ly9leGFtcGxlLmNvbS9mZWVk';
const GUID_SEGMENT = 'ZXBpc29kZS0x';

function createSpan(data: SpanJson['data']): SpanJson {
  return {
    data,
    span_id: 'b0e6f15b45c36b12',
    start_timestamp: 1,
    trace_id: '771a43a4192642f0b136d5159a501700',
  };
}

describe('sentryRedaction', () => {
  describe('createSentryRedactionHooks', () => {
    const hooks = createSentryRedactionHooks(SITE_ORIGIN);

    it('should replace the feed path in every field of an error event', () => {
      const event: ErrorEvent = {
        breadcrumbs: [
          {
            category: 'fetch',
            data: { url: `/feeds/${FEED_SEGMENT}/episodes/${GUID_SEGMENT}` },
          },
        ],
        exception: {
          values: [
            {
              type: 'Error',
              value: `Failed to render /feeds/${FEED_SEGMENT}`,
            },
          ],
        },
        request: {
          url: `${SITE_ORIGIN}/feeds/${FEED_SEGMENT}/episodes/${GUID_SEGMENT}?t=10`,
        },
        transaction: `/feeds/${FEED_SEGMENT}/episodes/${GUID_SEGMENT}`,
        type: undefined,
      };

      expect(hooks.beforeSend(event, {})).toEqual({
        breadcrumbs: [
          {
            category: 'fetch',
            data: { url: '/feeds/[feedUrlBase64]/episodes/[guidBase64]' },
          },
        ],
        exception: {
          values: [
            {
              type: 'Error',
              value: 'Failed to render /feeds/[feedUrlBase64]',
            },
          ],
        },
        request: {
          url: `${SITE_ORIGIN}/feeds/[feedUrlBase64]/episodes/[guidBase64]?t=10`,
        },
        transaction: '/feeds/[feedUrlBase64]/episodes/[guidBase64]',
        type: undefined,
      });
    });

    it('should replace the feed path in the url.full of a span', () => {
      const span = createSpan({
        'url.full': `${SITE_ORIGIN}/feeds/${FEED_SEGMENT}/episodes/${GUID_SEGMENT}`,
      });

      expect(hooks.beforeSendSpan(span)).toEqual(
        createSpan({
          'url.full': `${SITE_ORIGIN}/feeds/[feedUrlBase64]/episodes/[guidBase64]`,
        }),
      );
    });

    it('should replace the url query value of a breadcrumb', () => {
      expect(
        hooks.beforeBreadcrumb({
          category: 'fetch',
          data: {
            url: `/api/podcasts/chapters?url=${encodeURIComponent('https://example.com/chapters.json?token=abc')}`,
          },
        }),
      ).toEqual({
        category: 'fetch',
        data: { url: '/api/podcasts/chapters?url=[redacted]' },
      });
    });

    it('should not change a transaction with no feed path', () => {
      const event: TransactionEvent = {
        contexts: {
          trace: {
            data: { 'url.full': `${SITE_ORIGIN}/about` },
            span_id: 'b0e6f15b45c36b12',
            trace_id: '771a43a4192642f0b136d5159a501700',
          },
        },
        request: { url: `${SITE_ORIGIN}/about` },
        spans: [createSpan({ 'url.full': `${SITE_ORIGIN}/api/podcasts` })],
        transaction: '/about',
        type: 'transaction',
      };

      expect(hooks.beforeSendTransaction(event, {})).toEqual(event);
    });

    it('should remove the request header attributes of a span', () => {
      const span = createSpan({
        'http.method': 'GET',
        'http.request.header.x_now_route_matches': `nxtPfeedUrlBase64=${FEED_SEGMENT}`,
      });

      expect(hooks.beforeSendSpan(span)).toEqual(
        createSpan({ 'http.method': 'GET' }),
      );
    });

    it('should remove the request header attributes of a transaction', () => {
      const event: TransactionEvent = {
        contexts: {
          trace: {
            data: {
              'http.method': 'GET',
              'http.request.header.next_router_state_tree': `%5B%22feedUrlBase64%22%2C%22${FEED_SEGMENT}%22%5D`,
            },
            span_id: 'b0e6f15b45c36b12',
            trace_id: '771a43a4192642f0b136d5159a501700',
          },
        },
        spans: [
          createSpan({
            'http.request.header.x_now_route_matches': `nxtPfeedUrlBase64=${FEED_SEGMENT}`,
          }),
        ],
        transaction: 'GET /feeds/[feedUrlBase64]',
        type: 'transaction',
      };

      expect(hooks.beforeSendTransaction(event, {})).toEqual({
        contexts: {
          trace: {
            data: { 'http.method': 'GET' },
            span_id: 'b0e6f15b45c36b12',
            trace_id: '771a43a4192642f0b136d5159a501700',
          },
        },
        spans: [createSpan({})],
        transaction: 'GET /feeds/[feedUrlBase64]',
        type: 'transaction',
      });
    });

    it('should not change the input event', () => {
      const event: ErrorEvent = {
        request: { url: `${SITE_ORIGIN}/feeds/${FEED_SEGMENT}` },
        type: undefined,
      };

      hooks.beforeSend(event, {});

      expect(event.request?.url).toBe(`${SITE_ORIGIN}/feeds/${FEED_SEGMENT}`);
    });
  });

  describe('getSiteOrigin', () => {
    it('should return the origin of the base URL', () => {
      expect(getSiteOrigin('http://localhost:3000/')).toBe(
        'http://localhost:3000',
      );
      expect(getSiteOrigin('https://pod.monster/about')).toBe(SITE_ORIGIN);
    });

    it('should return the pod.monster origin when the base URL is not set', () => {
      expect(getSiteOrigin(undefined)).toBe(SITE_ORIGIN);
      expect(getSiteOrigin('')).toBe(SITE_ORIGIN);
    });

    it('should return the pod.monster origin when the base URL is not a URL', () => {
      expect(getSiteOrigin('pod.monster')).toBe(SITE_ORIGIN);
    });
  });
});
