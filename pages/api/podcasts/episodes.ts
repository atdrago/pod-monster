import type { NextApiHandler } from 'next';
import { ApiResponse } from 'podcastdx-client/src/types';

import { episodesByFeedId, getAuthValues } from '@atdrago/podcast-index';
import { IApiErrorResponse } from 'types';
import { createApiErrorResponse } from 'utils/createApiErrorResponse';
import { getPodcastIndexConfig } from 'utils/getPodcastIndexConfig';

const handler: NextApiHandler<
  ApiResponse.Episodes | IApiErrorResponse
> = async (req, res) => {
  const feedId = typeof req.query.feedId === 'string' ? req.query.feedId : null;
  const since =
    typeof req.query.since === 'string' ? parseInt(req.query.since) : null;

  if (!feedId) {
    return res.status(400).json(createApiErrorResponse('`feedId` is required'));
  }

  if (!since || isNaN(since)) {
    return res
      .status(400)
      .json(
        createApiErrorResponse('`since` is required and must be a valid number')
      );
  }

  const [authTime, authToken] = getAuthValues(
    process.env.NEXT_PUBLIC_PODCAST_INDEX_API_KEY,
    process.env.NEXT_PUBLIC_PODCAST_INDEX_API_SECRET
  );
  const config = getPodcastIndexConfig(authTime, authToken);

  try {
    const episodesResponse = await episodesByFeedId(feedId, { since }, config);

    // Stay fresh for 1 hour, and stale for 12 hours
    return res
      .setHeader(
        'Cache-Control',
        'public, s-maxage=3600, stale-while-revalidate=43200'
      )
      .status(200)
      .json(episodesResponse);
  } catch (err) {
    return res.status(500).json(createApiErrorResponse(err));
  }
};

export default handler;
