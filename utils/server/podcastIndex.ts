import 'server-only';

import { captureMessage } from '@sentry/nextjs';

import {
  getAuthValues,
  NetworkError,
  type PodcastIndexConfig,
} from '@atdrago/podcast-index';
import { getPodcastIndexConfig } from 'utils/getPodcastIndexConfig';

type PodcastIndexEndpoint =
  | 'episodes/byfeedid'
  | 'episodes/byguid'
  | 'episodes/byid'
  | 'podcasts/byfeedid'
  | 'podcasts/byfeedurl';

export const PODCAST_INDEX_ID_PATTERN = /^\d+$/;

const PODCAST_INDEX_CONFIGURATION_STATUSES = new Set([400, 401]);

export function createPodcastIndexConfig(): PodcastIndexConfig | undefined {
  const apiKey = process.env.NEXT_PUBLIC_PODCAST_INDEX_API_KEY;
  const apiSecret = process.env.NEXT_PUBLIC_PODCAST_INDEX_API_SECRET;

  // The declared type of each variable is `string`, but a deploy or a local
  // checkout can leave it out, and `getAuthValues` then throws.
  if (!apiKey || !apiSecret) {
    captureMessage('podcast_index_auth_failed', {
      extra: { reason: 'missing_credentials', source: 'podcastIndex' },
      level: 'error',
    });

    return undefined;
  }

  const [authTime, authToken] = getAuthValues(apiKey, apiSecret);

  return getPodcastIndexConfig(authTime, authToken);
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isSuccess(
  response: unknown,
): response is Record<string, unknown> {
  return isRecord(response) && response.status === 'true';
}

/**
 * Logs a failed Podcast Index call with safe fields only. The function does
 * not log the error itself, because the text of a native fetch error can hold
 * the request URL, and the query of that URL can hold a feed URL or a guid.
 */
export function logPodcastIndexFailure(
  endpoint: PodcastIndexEndpoint,
  error: unknown,
): void {
  const status = error instanceof NetworkError ? error.status : undefined;
  const isConfigurationError =
    status !== undefined && PODCAST_INDEX_CONFIGURATION_STATUSES.has(status);

  captureMessage(
    isConfigurationError
      ? 'podcast_index_auth_failed'
      : 'podcast_index_unavailable',
    {
      extra: {
        endpoint,
        reason: toPodcastIndexFailureReason(error),
        source: 'podcastIndex',
        status,
      },
      level: isConfigurationError ? 'error' : 'warning',
    },
  );
}

function toPodcastIndexFailureReason(error: unknown): string {
  if (error instanceof NetworkError) {
    return 'http_status';
  }

  if (
    error instanceof Error &&
    (error.name === 'TimeoutError' || error.name === 'AbortError')
  ) {
    return 'timeout';
  }

  if (error instanceof TypeError) {
    return 'network';
  }

  if (error instanceof SyntaxError) {
    return 'invalid_response';
  }

  return 'unknown';
}
