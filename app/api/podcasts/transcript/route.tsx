import { NextRequest, NextResponse } from 'next/server';
import { parse } from '@plussub/srt-vtt-parser';
import { captureMessage } from '@sentry/nextjs';

import {
  supportedTranscriptTypes,
  type TranscriptDocument,
  type TranscriptItem,
} from 'rest/fetchPodcastEpisodeTranscript';
import { isPrivateFeedUrl } from 'utils/isPrivateFeedUrl';
import {
  safeFetchFeedResource,
  type SafeFetchFailureReason,
} from 'utils/server/safeFetchFeed';
import { tryConvertTextOrHtmlToVtt } from 'utils/tryConvertTextOrHtmlToVtt';

import {
  GUARD_FAILURE_STATUSES,
  PRIVATE_CACHE_CONTROL,
  PUBLIC_CACHE_CONTROL,
} from '../proxyResponse';

type TranscriptErrorCode =
  | SafeFetchFailureReason
  | 'invalid_body'
  | 'missing_type'
  | 'missing_url'
  | 'unsupported_type';

interface TranscriptErrorResponse {
  error: { code: TranscriptErrorCode };
}

// eslint-disable-next-line @typescript-eslint/naming-convention -- Next.js routes a request by the name of the HTTP method.
export async function GET(
  request: NextRequest,
): Promise<NextResponse<TranscriptDocument | TranscriptErrorResponse>> {
  const transcriptUrl = request.nextUrl.searchParams.get('url');
  const type = request.nextUrl.searchParams.get('type');
  const durationString = request.nextUrl.searchParams.get('duration');
  const duration = durationString ? parseFloat(durationString) : null;

  if (!transcriptUrl) {
    return createErrorResponse('missing_url', 400);
  }

  if (!type) {
    return createErrorResponse('missing_type', 400);
  }

  if (!supportedTranscriptTypes.includes(type)) {
    return createErrorResponse('unsupported_type', 501);
  }

  // The request URL holds the transcript URL, and a private transcript URL
  // can hold a member token. Thus, no shared cache keeps such an answer.
  const isPrivateTarget = isPrivateFeedUrl(transcriptUrl);
  const errorHeaders = isPrivateTarget
    ? { 'Cache-Control': PRIVATE_CACHE_CONTROL }
    : undefined;
  const result = await safeFetchFeedResource(transcriptUrl);

  if (result.kind === 'error') {
    return createErrorResponse(
      result.reason,
      GUARD_FAILURE_STATUSES[result.reason],
      errorHeaders,
    );
  }

  let transcript: TranscriptDocument | null;

  try {
    transcript = await toTranscriptDocument(result.body, type, duration);
  } catch {
    // The parse error quotes the transcript text, so the log holds the type
    // only.
    captureMessage('transcript_proxy_parse_failed', {
      extra: { type },
      level: 'warning',
    });

    return createErrorResponse('invalid_body', 502, errorHeaders);
  }

  if (transcript === null) {
    return createErrorResponse('unsupported_type', 501, errorHeaders);
  }

  return NextResponse.json(transcript, {
    headers: {
      'Cache-Control': isPrivateTarget
        ? PRIVATE_CACHE_CONTROL
        : PUBLIC_CACHE_CONTROL,
    },
    status: 200,
  });
}

function createErrorResponse(
  code: TranscriptErrorCode,
  status: number,
  headers?: Record<string, string>,
): NextResponse<TranscriptErrorResponse> {
  return NextResponse.json({ error: { code } }, { headers, status });
}

async function toTranscriptDocument(
  body: string,
  requestedType: string,
  duration: number | null,
): Promise<TranscriptDocument | null> {
  let type = requestedType;
  let text = body;

  if (type === 'text/html') {
    const vtt = await tryConvertTextOrHtmlToVtt(text, duration);

    if (vtt) {
      type = 'text/vtt';
      text = vtt;
    }
  }

  switch (type) {
    case 'application/srt':
    case 'text/vtt': {
      const entries = parse(text).entries.map(
        ({ from, id, text: entryText, to }): TranscriptItem => ({
          // Convert from ms to seconds
          from: from / 1000,
          id,
          text: entryText,
          to: to / 1000,
        }),
      );

      return { content: entries, type };
    }
    case 'text/html': {
      return { content: text, type };
    }
    default: {
      return null;
    }
  }
}
