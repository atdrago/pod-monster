import { captureMessage } from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';

import type { Chapter } from 'types';
import { isPrivateFeedUrl } from 'utils/isPrivateFeedUrl';
import { isRecord } from 'utils/server/podcastIndex';
import {
  safeFetchFeedResource,
  type SafeFetchFailureReason,
} from 'utils/server/safeFetchFeed';

import {
  GUARD_FAILURE_STATUSES,
  PRIVATE_CACHE_CONTROL,
  PUBLIC_CACHE_CONTROL,
} from '../proxyResponse';

type ChaptersErrorCode =
  | SafeFetchFailureReason
  | 'invalid_body'
  | 'missing_url';

interface ChaptersErrorResponse {
  error: { code: ChaptersErrorCode };
}

// eslint-disable-next-line @typescript-eslint/naming-convention -- Next.js routes a request by the name of the HTTP method.
export async function GET(
  request: NextRequest,
): Promise<NextResponse<Array<Chapter> | ChaptersErrorResponse>> {
  const chaptersUrl = request.nextUrl.searchParams.get('url');

  if (!chaptersUrl) {
    return createErrorResponse('missing_url', 400);
  }

  // The request URL holds the chapters URL, and a private chapters URL can
  // hold a member token. Thus, no shared cache keeps such an answer.
  const isPrivateTarget = isPrivateFeedUrl(chaptersUrl);
  const errorHeaders = isPrivateTarget
    ? { 'Cache-Control': PRIVATE_CACHE_CONTROL }
    : undefined;
  const result = await safeFetchFeedResource(chaptersUrl);

  if (result.kind === 'error') {
    return createErrorResponse(
      result.reason,
      GUARD_FAILURE_STATUSES[result.reason],
      errorHeaders,
    );
  }

  const chapters = parseChapters(result.body);

  if (chapters === null) {
    return createErrorResponse('invalid_body', 502, errorHeaders);
  }

  return NextResponse.json(chapters, {
    headers: {
      'Cache-Control': isPrivateTarget
        ? PRIVATE_CACHE_CONTROL
        : PUBLIC_CACHE_CONTROL,
    },
    status: 200,
  });
}

function createErrorResponse(
  code: ChaptersErrorCode,
  status: number,
  headers?: Record<string, string>,
): NextResponse<ChaptersErrorResponse> {
  return NextResponse.json({ error: { code } }, { headers, status });
}

/**
 * Returns the chapters that have a start time, sorted by it, or `null` for a
 * body that is not a chapters document. The logs never hold the body text,
 * because the parse error of `JSON.parse` quotes the body.
 */
function parseChapters(body: string): Array<Chapter> | null {
  let chaptersDocument: unknown;

  try {
    chaptersDocument = JSON.parse(body);
  } catch {
    captureMessage('chapters_proxy_invalid_body', {
      extra: { reason: 'invalid_json' },
      level: 'warning',
    });

    return null;
  }

  if (
    !isRecord(chaptersDocument) ||
    !Array.isArray(chaptersDocument.chapters)
  ) {
    captureMessage('chapters_proxy_invalid_body', {
      extra: { reason: 'invalid_shape' },
      level: 'warning',
    });

    return null;
  }

  return chaptersDocument.chapters
    .filter(isChapter)
    .sort((chapterA, chapterB) => chapterA.startTime - chapterB.startTime);
}

function isOptionalOfType(value: unknown, type: 'boolean' | 'string'): boolean {
  return value === undefined || value === null || typeof value === type;
}

function isChapter(value: unknown): value is Chapter {
  return (
    isRecord(value) &&
    typeof value.startTime === 'number' &&
    isOptionalOfType(value.img, 'string') &&
    isOptionalOfType(value.title, 'string') &&
    isOptionalOfType(value.toc, 'boolean') &&
    isOptionalOfType(value.url, 'string')
  );
}
