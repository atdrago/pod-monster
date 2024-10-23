import { NextRequest, NextResponse } from 'next/server';

import { episodesByFeedId, getAuthValues } from '@atdrago/podcast-index';
import {
  createApiErrorResponse,
  type ApiErrorResponse,
} from 'utils/createApiErrorResponse';
import { getPodcastIndexConfig } from 'utils/getPodcastIndexConfig';
import { ApiResponse } from 'podcastdx-client/src/types';

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function GET(
  request: NextRequest,
): Promise<NextResponse<ApiResponse.Episodes | ApiErrorResponse>> {
  const feedId = request.nextUrl.searchParams.get('feedId');
  const sinceString = request.nextUrl.searchParams.get('since');
  const since = sinceString ? parseInt(sinceString) : null;

  if (!feedId) {
    return NextResponse.json(createApiErrorResponse('`feedId` is required'), {
      status: 400,
    });
  }

  if (typeof since !== 'number' || isNaN(since)) {
    return NextResponse.json(
      createApiErrorResponse('`since` is required and must be a valid number'),
      { status: 400 },
    );
  }

  const [authTime, authToken] = getAuthValues(
    process.env.NEXT_PUBLIC_PODCAST_INDEX_API_KEY,
    process.env.NEXT_PUBLIC_PODCAST_INDEX_API_SECRET,
  );
  const config = getPodcastIndexConfig(authTime, authToken);

  try {
    const episodesResponse = await episodesByFeedId(feedId, { since }, config);

    return NextResponse.json(episodesResponse, {
      headers: {
        // Stay fresh for 1 hour, and stale for 12 hours
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=43200',
      },
      status: 200,
    });
  } catch (err) {
    return NextResponse.json(createApiErrorResponse(err), { status: 500 });
  }
}
