import { NextRequest, NextResponse } from 'next/server';
import {
  ExternalOpmlFile,
  ExternalOpmlOutline,
  opmlToJSON,
} from 'opml-to-json';

import { getAuthValues, podcastsByFeedUrl } from '@atdrago/podcast-index';
import type { FeedSettings } from 'contexts/SettingsContext';
import { createApiErrorResponse } from 'utils/createApiErrorResponse';
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

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function POST(request: NextRequest) {
  const [authTime, authToken] = getAuthValues(
    process.env.NEXT_PUBLIC_PODCAST_INDEX_API_KEY,
    process.env.NEXT_PUBLIC_PODCAST_INDEX_API_SECRET,
  );
  const config = getPodcastIndexConfig(authTime, authToken);
  const opmlRoot = await opmlToJSON(await request.text());

  if (!opmlRoot.children) {
    return NextResponse.json(createApiErrorResponse('Invalid OPML file.'), {
      status: 400,
    });
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

  return NextResponse.json(
    { errors: feedSettingsErrors, feedSettings },
    { status: 200 },
  );
}
