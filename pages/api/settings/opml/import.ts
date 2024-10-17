import type { NextApiHandler } from 'next';
import {
  ExternalOpmlFile,
  ExternalOpmlOutline,
  opmlToJSON,
} from 'opml-to-json';

import { getAuthValues, podcastsByFeedUrl } from '@atdrago/podcast-index';
import type { OpmlImportResponse } from 'rest/fetchOpmlImport';
import type { FeedSettings } from 'contexts/SettingsContext';
import {
  createApiErrorResponse,
  type ApiErrorResponse,
} from 'utils/createApiErrorResponse';
import { getPodcastIndexConfig } from 'utils/getPodcastIndexConfig';

const getOpmlFeeds = (outline: ExternalOpmlOutline | ExternalOpmlFile) => {
  const feeds = [];

  if ('xmlurl' in outline && outline.xmlurl) {
    feeds.push(outline);
  }

  if (outline.children) {
    outline.children.forEach((child) => {
      feeds.push(...getOpmlFeeds(child));
    });
  }

  return feeds;
};

const handler: NextApiHandler<OpmlImportResponse | ApiErrorResponse> = async (
  req,
  res,
) => {
  if (req.method?.toLowerCase() !== 'post') {
    return res.status(400).json(createApiErrorResponse('Method must be POST'));
  }

  if (!req.body) {
    return res.status(400).json(createApiErrorResponse('Missing body'));
  }

  const [authTime, authToken] = getAuthValues(
    process.env.NEXT_PUBLIC_PODCAST_INDEX_API_KEY,
    process.env.NEXT_PUBLIC_PODCAST_INDEX_API_SECRET,
  );
  const config = getPodcastIndexConfig(authTime, authToken);
  const opmlRoot = await opmlToJSON(req.body);

  if (!opmlRoot.children) {
    return res.status(400).json(createApiErrorResponse('Invalid OPML file.'));
  }

  const feeds = getOpmlFeeds(opmlRoot);

  const feedResponses = await Promise.allSettled(
    feeds.map(async (feed) => {
      if (feed && feed.xmlurl) {
        return await podcastsByFeedUrl(feed.xmlurl, config);
      }

      return null;
    }),
  );

  const feedSettings: FeedSettings = {};

  const feedSettingsErrors: Array<{ title: string }> = [];

  feedResponses.forEach((feedResponse, index) => {
    const opmlFeed = feeds?.[index];

    if (feedResponse.status === 'rejected') {
      feedSettingsErrors.push({
        title: opmlFeed?.title ?? opmlFeed?.text ?? 'Unknown',
      });

      return;
    }

    if (feedResponse.status === 'fulfilled') {
      const feed = feedResponse.value?.feed;

      if (!feed) {
        feedSettingsErrors.push({
          title: opmlFeed?.title ?? opmlFeed?.text ?? 'Unknown',
        });

        return;
      }

      feedSettings[feed.id] = {
        htmlUrl: feed.link,
        image: feed.image,
        subscribedAt: new Date().toJSON(),
        title: feed.title,
        type: feed.type === 0 ? 'rss' : 'atom',
        xmlUrl: feed.url,
      };
    }
  });

  return res.status(200).json({ errors: feedSettingsErrors, feedSettings });
};

export default handler;
