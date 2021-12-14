import { NextApiHandler } from 'next';
import { opmlToJSON } from 'opml-to-json';

import type { FeedSettings, IErrorResponse, OpmlImportResponse } from 'types';
import { getPodcastIndexConfig } from 'utils/getPodcastIndexConfig';
import { podcastsByFeedUrl } from 'utils/podcastIndex';
import { getAuthValues } from 'utils/podcastIndex/getAuthValues';

const handler: NextApiHandler<OpmlImportResponse | IErrorResponse> = async (
  req,
  res
) => {
  if (req.method?.toLowerCase() !== 'post') {
    return res.status(400).json({ error: 'Method must be POST' });
  }

  if (!req.body) {
    return res.status(400).json({ error: 'Missing body' });
  }

  const [authTime, authToken] = getAuthValues(
    process.env.NEXT_PUBLIC_PODCAST_INDEX_API_KEY,
    process.env.NEXT_PUBLIC_PODCAST_INDEX_API_SECRET
  );
  const config = getPodcastIndexConfig(`${authTime}`, authToken);
  const json = await opmlToJSON(req.body);

  if (!json.children) {
    return res.status(400).json({ error: 'Invalid OPML file.' });
  }

  const feedResponses = await Promise.allSettled(
    json.children.map(async (child) => {
      if (child && child.xmlurl) {
        return await podcastsByFeedUrl(child.xmlurl, config);
      }

      return null;
    })
  );

  const feedSettings: FeedSettings = {};

  const feedSettingsErrors: Array<{ title: string }> = [];

  feedResponses.forEach((feedResponse, index) => {
    const opmlFeed = json.children?.[index];

    if (feedResponse.status === 'rejected') {
      feedSettingsErrors.push({
        title: opmlFeed?.title ?? 'Unknown',
      });

      return;
    }

    if (feedResponse.status === 'fulfilled') {
      const feed = feedResponse.value?.feed;

      if (!feed) {
        feedSettingsErrors.push({
          title: opmlFeed?.title ?? 'Unknown',
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
