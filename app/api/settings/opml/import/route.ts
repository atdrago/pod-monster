import { captureMessage } from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import {
  ExternalOpmlFile,
  ExternalOpmlOutline,
  opmlToJSON,
} from 'opml-to-json';

import { getAuthValues, type PodcastIndexConfig } from '@atdrago/podcast-index';
import type { FeedSettings } from 'contexts/SettingsContext';
import type { OpmlImportResponse } from 'rest/fetchOpmlImport';
import { createApiErrorResponse } from 'utils/createApiErrorResponse';
import { getPodcastIndexConfig } from 'utils/getPodcastIndexConfig';
import { isPrivateFeedUrl } from 'utils/isPrivateFeedUrl';
import { mapPodcastIndexFeed } from 'utils/server/mapPodcastIndexFeed';
import {
  fetchPodcastIndexFeedByUrl,
  logPodcastIndexFailure,
} from 'utils/server/podcastIndex';
import { toHttpUrl } from 'utils/toHttpUrl';

type OpmlFeedOutline = ExternalOpmlOutline & { xmlurl: string };

const getOpmlFeeds = (
  outline: ExternalOpmlOutline | ExternalOpmlFile,
): Array<OpmlFeedOutline> => {
  const feeds: Array<OpmlFeedOutline> = [];

  const xmlUrl = 'xmlurl' in outline ? outline.xmlurl?.trim() : undefined;

  if (xmlUrl) {
    feeds.push({ ...outline, xmlurl: xmlUrl });
  }

  if (outline.children) {
    outline.children.forEach((child) => {
      feeds.push(...getOpmlFeeds(child));
    });
  }

  return feeds;
};

const getErrorName = (error: unknown) =>
  error instanceof Error ? error.name : 'unknown';

/**
 * The library record of a feed that Podcast Index knows, or `undefined`.
 */
const fetchFeedSettingsItem = async (
  opmlFeed: OpmlFeedOutline,
  config: PodcastIndexConfig,
): Promise<FeedSettings[string] | undefined> => {
  try {
    const podcastIndexFeed = await fetchPodcastIndexFeedByUrl(
      opmlFeed.xmlurl,
      config,
    );

    if (podcastIndexFeed === undefined) {
      return undefined;
    }

    const feed = mapPodcastIndexFeed(podcastIndexFeed, opmlFeed.xmlurl);

    return {
      htmlUrl: feed.link,
      image: feed.image,
      podcastIndexId: feed.podcastIndexId,
      subscribedAt: new Date().toJSON(),
      title: feed.title || opmlFeed.title || opmlFeed.text || '',
      type: feed.format,
    };
  } catch (error) {
    logPodcastIndexFailure('podcasts/byfeedurl', error);

    return undefined;
  }
};

/**
 * Keys each record by the `xmlurl` of the OPML file. A private feed URL or a
 * URL that is not `http:` or `https:` gets no Podcast Index call, and the
 * answer lists it as not imported.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export async function POST(request: NextRequest) {
  let opmlRoot: ExternalOpmlFile;

  try {
    opmlRoot = await opmlToJSON(await request.text());
  } catch (error) {
    captureMessage('opml_import_parse_failed', {
      extra: { errorName: getErrorName(error) },
      level: 'warning',
    });

    return NextResponse.json(createApiErrorResponse('Invalid OPML file.'), {
      status: 400,
    });
  }

  if (!opmlRoot.children) {
    return NextResponse.json(createApiErrorResponse('Invalid OPML file.'), {
      status: 400,
    });
  }

  const [authTime, authToken] = getAuthValues(
    process.env.NEXT_PUBLIC_PODCAST_INDEX_API_KEY,
    process.env.NEXT_PUBLIC_PODCAST_INDEX_API_SECRET,
  );
  const config = getPodcastIndexConfig(authTime, authToken);
  const opmlFeeds = getOpmlFeeds(opmlRoot);

  const importResults = await Promise.all(
    opmlFeeds.map(async (opmlFeed) => ({
      feedSettingsItem:
        isPrivateFeedUrl(opmlFeed.xmlurl) ||
        toHttpUrl(opmlFeed.xmlurl) === undefined
          ? undefined
          : await fetchFeedSettingsItem(opmlFeed, config),
      opmlFeed,
    })),
  );

  const feedSettings: FeedSettings = {};
  const feedSettingsErrors: OpmlImportResponse['errors'] = [];

  importResults.forEach(({ feedSettingsItem, opmlFeed }) => {
    if (feedSettingsItem === undefined) {
      feedSettingsErrors.push({
        feedUrl: opmlFeed.xmlurl,
        title: opmlFeed.title ?? opmlFeed.text ?? 'Unknown',
      });

      return;
    }

    feedSettings[opmlFeed.xmlurl] = feedSettingsItem;
  });

  return NextResponse.json(
    { errors: feedSettingsErrors, feedSettings },
    { status: 200 },
  );
}
