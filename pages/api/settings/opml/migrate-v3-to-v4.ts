import type { NextApiHandler } from 'next';

import { getAuthValues, podcastsByFeedId } from '@atdrago/podcast-index';
import type {
  FeedSettings,
  IApiErrorResponse,
  OpmlImportResponse,
} from 'types';
import { createApiErrorResponse } from 'utils/createApiErrorResponse';
import { getPodcastIndexConfig } from 'utils/getPodcastIndexConfig';

const handler: NextApiHandler<OpmlImportResponse | IApiErrorResponse> = async (
  req,
  res
) => {
  const ids = req.query.ids
    ? typeof req.query.ids === 'string'
      ? req.query.ids.split(',')
      : req.query.ids
    : null;

  if (!ids) {
    return res.status(400).json(createApiErrorResponse('`ids` is required'));
  }

  const [authTime, authToken] = getAuthValues(
    process.env.NEXT_PUBLIC_PODCAST_INDEX_API_KEY,
    process.env.NEXT_PUBLIC_PODCAST_INDEX_API_SECRET
  );
  const config = getPodcastIndexConfig(`${authTime}`, authToken);

  const feedResponses = await Promise.allSettled(
    ids.map(async (id) => await podcastsByFeedId(id, config))
  );

  const feedSettings: FeedSettings = {};

  const feedSettingsErrors: Array<{ reason: string; title: string }> = [];

  feedResponses.forEach((feedResponse) => {
    switch (feedResponse.status) {
      case 'fulfilled': {
        const { feed } = feedResponse.value;

        feedSettings[feed.id] = {
          htmlUrl: feed.link,
          image: feed.image,
          subscribedAt: new Date().toJSON(),
          title: feed.title,
          type: feed.type === 0 ? 'rss' : 'atom',
          xmlUrl: feed.url,
        };

        break;
      }

      case 'rejected':
      default:
        // Do nothing
        break;
    }
  });

  return res.status(200).json({ errors: feedSettingsErrors, feedSettings });
};

export default handler;
