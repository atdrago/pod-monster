import 'server-only';

import { captureMessage } from '@sentry/nextjs';
import {
  type AnyFeed,
  DetectError,
  type ItunesNs,
  parseFeed,
  type PodcastNs,
} from 'feedsmith';

import type { PodcastEpisode, PodcastFeed } from 'types/PodcastFeed';
import { getEpisodeIdentity } from 'utils/getEpisodeIdentity';
import { toHttpUrl } from 'utils/toHttpUrl';

type ParseRssFeedResult =
  | { episodes: Array<PodcastEpisode>; feed: PodcastFeed; kind: 'feed' }
  | { kind: 'not_a_feed' };

type ParseFailureReason =
  | 'doctype'
  | 'malformed'
  | 'unrecognized_format'
  | 'unsupported_format';

// A DTD can define entities, which is the vector of the billion laughs and XXE
// attacks. A podcast feed does not declare one, so the parse does not start.
const DOCTYPE_PATTERN = /<!DOCTYPE/i;

/**
 * Parses an RSS feed into a show and all of its episodes, in feed order. The
 * identity of an episode is its trimmed guid, else its enclosure URL. When two
 * items have the same identity, only the first item stays.
 */
export function parseRssFeed(
  body: string,
  feedUrl: string,
): ParseRssFeedResult {
  if (DOCTYPE_PATTERN.test(body)) {
    return createParseFailure('doctype');
  }

  let parsedFeed: AnyFeed;

  try {
    parsedFeed = parseFeed(body);
  } catch (error) {
    return createParseFailure(
      error instanceof DetectError ? 'unrecognized_format' : 'malformed',
    );
  }

  if (parsedFeed.format !== 'rss') {
    return createParseFailure('unsupported_format');
  }

  const channel = parsedFeed.feed;
  const feedTitle = channel.title?.trim() ?? '';
  const feedImage =
    toHttpUrl(channel.itunes?.image) ?? toHttpUrl(channel.image?.url);
  const feed: PodcastFeed = {
    author: channel.itunes?.author ?? channel.itunes?.owner?.name,
    categories: toCategoryNames(channel.itunes?.categories),
    description: channel.description ?? channel.itunes?.summary,
    explicit: channel.itunes?.explicit,
    format: 'rss',
    funding: toFunding(channel.podcast?.fundings),
    image: feedImage,
    isSerial: channel.itunes?.type === 'serial',
    link: toHttpUrl(channel.link),
    title: feedTitle,
    url: feedUrl,
  };
  const episodes: Array<PodcastEpisode> = [];
  const seenIdentities = new Set<string>();

  for (const item of channel.items ?? []) {
    const enclosure = item.enclosures?.[0];
    const identity = getEpisodeIdentity(item.guid?.value, enclosure?.url);

    if (identity === undefined || seenIdentities.has(identity)) {
      continue;
    }

    seenIdentities.add(identity);
    episodes.push({
      chaptersUrl: toHttpUrl(item.podcast?.chapters?.url),
      datePublished: toUnixSeconds(item.pubDate),
      description: item.content?.encoded ?? item.description,
      duration: toNonNegativeNumber(item.itunes?.duration),
      enclosureType: enclosure?.type,
      enclosureUrl: toHttpUrl(enclosure?.url),
      episodeNumber:
        toNonNegativeNumber(item.podcast?.episode?.number) ??
        toNonNegativeNumber(item.itunes?.episode),
      episodeType: item.itunes?.episodeType?.trim().toLowerCase() || undefined,
      explicit: item.itunes?.explicit,
      feedImage,
      feedTitle,
      feedUrl,
      identity,
      image: toHttpUrl(item.itunes?.image),
      persons: toPersons(item.podcast?.persons),
      seasonNumber:
        toNonNegativeNumber(item.podcast?.season?.number) ??
        toNonNegativeNumber(item.itunes?.season),
      title: item.title?.trim() ?? '',
      transcripts: toTranscripts(item.podcast?.transcripts),
    });
  }

  return { episodes, feed, kind: 'feed' };
}

function createParseFailure(reason: ParseFailureReason): ParseRssFeedResult {
  captureMessage('rss_feed_not_parsed', {
    extra: { reason },
    level: 'warning',
  });

  return { kind: 'not_a_feed' };
}

function toNonNegativeNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? value
    : undefined;
}

function toUnixSeconds(pubDate: string | undefined): number | undefined {
  if (pubDate === undefined) {
    return undefined;
  }

  const milliseconds = Date.parse(pubDate);

  return Number.isNaN(milliseconds)
    ? undefined
    : Math.floor(milliseconds / 1000);
}

function toCategoryNames(
  categories: Array<ItunesNs.Category> | undefined,
): Array<string> | undefined {
  const names: Array<string> = [];

  // Apple Podcasts allows one level of subcategories.
  for (const category of categories ?? []) {
    const subcategoryNames = (category.categories ?? []).map(
      ({ text }) => text,
    );

    for (const name of [category.text, ...subcategoryNames]) {
      if (name && !names.includes(name)) {
        names.push(name);
      }
    }
  }

  return names.length > 0 ? names : undefined;
}

function toFunding(
  fundings: Array<PodcastNs.Funding> | undefined,
): PodcastFeed['funding'] {
  const funding = fundings?.find(({ url }) => toHttpUrl(url) !== undefined);

  if (funding?.url === undefined) {
    return undefined;
  }

  return { message: funding.display?.trim() || funding.url, url: funding.url };
}

function toPersons(
  persons: Array<PodcastNs.Person> | undefined,
): PodcastEpisode['persons'] {
  const mappedPersons = (persons ?? []).flatMap(
    ({ display, group, href, img, role }) => {
      const name = display?.trim();

      return name
        ? [{ group, href: toHttpUrl(href), img: toHttpUrl(img), name, role }]
        : [];
    },
  );

  return mappedPersons.length > 0 ? mappedPersons : undefined;
}

function toTranscripts(
  transcripts: Array<PodcastNs.Transcript> | undefined,
): PodcastEpisode['transcripts'] {
  const mappedTranscripts = (transcripts ?? []).flatMap(
    ({ language, rel, type, url }) => {
      const httpUrl = toHttpUrl(url);

      return httpUrl !== undefined && type
        ? [{ language, rel, type, url: httpUrl }]
        : [];
    },
  );

  return mappedTranscripts.length > 0 ? mappedTranscripts : undefined;
}
