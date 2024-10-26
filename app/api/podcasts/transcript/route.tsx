import { NextRequest, NextResponse } from 'next/server';
import { parse } from '@plussub/srt-vtt-parser';

import {
  supportedTranscriptTypes,
  type TranscriptDocument,
  type TranscriptItem,
} from 'rest/fetchPodcastEpisodeTranscript';
import {
  createApiErrorResponse,
  type ApiErrorResponse,
} from 'utils/createApiErrorResponse';
import { tryConvertTextOrHtmlToVtt } from 'utils/tryConvertTextOrHtmlToVtt';
import { ReactElement } from 'react';

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function GET(
  request: NextRequest,
): Promise<
  NextResponse<TranscriptDocument | ApiErrorResponse | ReactElement<any, any>>
> {
  const url = request.nextUrl.searchParams.get('url');
  let type = request.nextUrl.searchParams.get('type');
  const durationString = request.nextUrl.searchParams.get('duration');
  const duration = durationString ? parseFloat(durationString) : null;

  if (!url) {
    return NextResponse.json(createApiErrorResponse('`url` is required'), {
      status: 400,
    });
  }

  if (!type) {
    return NextResponse.json(createApiErrorResponse('`type` is required'), {
      status: 400,
    });
  }

  if (!supportedTranscriptTypes.includes(type)) {
    return NextResponse.json(
      createApiErrorResponse(`The transcript type "${type}" is not supported.`),
      { status: 501 },
    );
  }

  try {
    const transcriptResponse = await fetch(url, {
      method: 'GET',
    });

    if (!transcriptResponse.ok) {
      throw new Error(
        `Failed to fetch transcript: ${transcriptResponse.statusText}`,
      );
    }

    let transcriptResponseText = await transcriptResponse.text();

    if (type === 'text/html') {
      const vtt = await tryConvertTextOrHtmlToVtt(
        transcriptResponseText,
        duration,
      );

      if (vtt) {
        type = 'text/vtt';
        transcriptResponseText = vtt;
      }
    }

    switch (type) {
      case 'application/srt':
      case 'text/vtt': {
        const entries = parse(transcriptResponseText).entries.map(
          ({ from, id, text, to }): TranscriptItem => ({
            // Convert from ms to seconds
            from: from / 1000,
            id,
            text,
            to: to / 1000,
          }),
        );

        return NextResponse.json(
          { content: entries, type },
          {
            headers: {
              'Cache-Control':
                'public, s-maxage=60, stale-while-revalidate=3600',
            },
            status: 200,
          },
        );
      }
      case 'text/html': {
        return NextResponse.json(
          {
            content: transcriptResponseText,
            type,
          },
          {
            headers: {
              'Cache-Control':
                'public, s-maxage=60, stale-while-revalidate=3600',
            },
            status: 200,
          },
        );
      }
      default: {
        return NextResponse.json(
          createApiErrorResponse(
            `The transcript type "${type}" is not supported.`,
          ),
          { status: 501 },
        );
      }
    }
  } catch (err) {
    return NextResponse.json(createApiErrorResponse(err), { status: 500 });
  }
}
