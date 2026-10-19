import 'server-only';

import type {
  PIApiEpisodeDetail,
  PIApiEpisodeInfo,
  PIApiPodcast,
} from 'podcastdx-client/src/types';

import type { PodcastEpisode, PodcastFeed } from 'types/PodcastFeed';

// The type of an `episodes/byfeedid` item has no persons and no transcripts.
// Only the type of an `episodes/byguid` answer has them.
type PodcastIndexEpisode = Pick<
  PIApiEpisodeInfo,
  | 'chaptersUrl'
  | 'datePublished'
  | 'description'
  | 'duration'
  | 'enclosureType'
  | 'enclosureUrl'
  | 'episode'
  | 'episodeType'
  | 'explicit'
  | 'feedImage'
  | 'guid'
  | 'image'
  | 'season'
  | 'title'
> &
  Partial<Pick<PIApiEpisodeDetail, 'persons' | 'transcripts'>>;

const PODCAST_INDEX_ATOM_TYPE = 1;

/**
 * Maps a show from Podcast Index. The URL is the requested feed URL, not the
 * URL that Podcast Index stores, so that the keys and the links of the page
 * agree with its path.
 *
 * The values of Podcast Index can be `null` or empty, though the types do not
 * say so. Each such value is absent in the result.
 */
export function mapPodcastIndexFeed(
  podcastIndexFeed: PIApiPodcast,
  feedUrl: string,
): PodcastFeed {
  return {
    author: toText(podcastIndexFeed.author),
    categories: toCategoryNames(podcastIndexFeed.categories),
    description: toText(podcastIndexFeed.description),
    explicit: toExplicit(podcastIndexFeed.explicit),
    format: podcastIndexFeed.type === PODCAST_INDEX_ATOM_TYPE ? 'atom' : 'rss',
    funding: toFunding(podcastIndexFeed.funding),
    image: toHttpUrl(podcastIndexFeed.image),
    isSerial:
      'itunesType' in podcastIndexFeed &&
      podcastIndexFeed.itunesType === 'serial',
    link: toHttpUrl(podcastIndexFeed.link),
    podcastIndexId: podcastIndexFeed.id,
    title: toTrimmedText(podcastIndexFeed.title),
    url: feedUrl,
  };
}

/**
 * Maps an episode from Podcast Index. Returns `undefined` for an episode with
 * no guid and no enclosure URL, because such an episode has no identity.
 */
export function mapPodcastIndexEpisode(
  podcastIndexEpisode: PodcastIndexEpisode,
  feed: Pick<PodcastFeed, 'image' | 'title' | 'url'>,
): PodcastEpisode | undefined {
  const identity = toEpisodeIdentity(
    podcastIndexEpisode.guid,
    podcastIndexEpisode.enclosureUrl,
  );

  if (identity === undefined) {
    return undefined;
  }

  return {
    chaptersUrl: toHttpUrl(podcastIndexEpisode.chaptersUrl),
    datePublished: toPositiveNumber(podcastIndexEpisode.datePublished),
    description: toText(podcastIndexEpisode.description),
    duration: toPositiveNumber(podcastIndexEpisode.duration),
    enclosureType: toText(podcastIndexEpisode.enclosureType),
    enclosureUrl: toHttpUrl(podcastIndexEpisode.enclosureUrl),
    episodeNumber: toPositiveNumber(podcastIndexEpisode.episode),
    episodeType:
      toText(podcastIndexEpisode.episodeType)?.trim().toLowerCase() ||
      undefined,
    explicit: toExplicit(podcastIndexEpisode.explicit),
    feedImage: toHttpUrl(podcastIndexEpisode.feedImage) ?? feed.image,
    feedTitle: feed.title,
    feedUrl: feed.url,
    identity,
    image: toHttpUrl(podcastIndexEpisode.image),
    persons: toPersons(podcastIndexEpisode.persons),
    seasonNumber: toPositiveNumber(podcastIndexEpisode.season),
    title: toTrimmedText(podcastIndexEpisode.title),
    transcripts: toTranscripts(podcastIndexEpisode.transcripts),
  };
}

/**
 * The same rule as the RSS parser: the trimmed guid, else the trimmed
 * enclosure URL, with no change of case.
 */
function toEpisodeIdentity(
  guid: unknown,
  enclosureUrl: unknown,
): string | undefined {
  return toText(guid)?.trim() || toText(enclosureUrl)?.trim() || undefined;
}

function toText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value : undefined;
}

function toTrimmedText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function toHttpUrl(value: unknown): string | undefined {
  if (typeof value !== 'string' || !URL.canParse(value)) {
    return undefined;
  }

  const { protocol } = new URL(value);

  return protocol === 'http:' || protocol === 'https:' ? value : undefined;
}

// Podcast Index gives 0 or `null` for a season, an episode number, a date, or
// a duration that the feed does not give.
function toPositiveNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : undefined;
}

// A show gives a boolean, and an episode gives 0 or 1.
function toExplicit(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') {
    return value;
  }

  return typeof value === 'number' ? value > 0 : undefined;
}

function toCategoryNames(
  categories: PIApiPodcast['categories'],
): Array<string> | undefined {
  const names = Object.values(categories ?? {}).filter(
    (name, index, allNames) =>
      toText(name) !== undefined && allNames.indexOf(name) === index,
  );

  return names.length > 0 ? names : undefined;
}

function toFunding(
  funding: PIApiPodcast['funding'] | null,
): PodcastFeed['funding'] {
  const url = toHttpUrl(funding?.url);

  if (url === undefined) {
    return undefined;
  }

  return { message: toText(funding?.message)?.trim() ?? url, url };
}

function toPersons(
  persons: PIApiEpisodeDetail['persons'] | undefined,
): PodcastEpisode['persons'] {
  const mappedPersons = (persons ?? []).flatMap(
    ({ group, href, img, name, role }) => {
      const trimmedName = toText(name)?.trim();

      return trimmedName
        ? [
            {
              group: toText(group),
              href: toHttpUrl(href),
              img: toHttpUrl(img),
              name: trimmedName,
              role: toText(role),
            },
          ]
        : [];
    },
  );

  return mappedPersons.length > 0 ? mappedPersons : undefined;
}

function toTranscripts(
  transcripts: PIApiEpisodeDetail['transcripts'] | undefined,
): PodcastEpisode['transcripts'] {
  const mappedTranscripts = (transcripts ?? []).flatMap(({ type, url }) => {
    const httpUrl = toHttpUrl(url);
    const transcriptType = toText(type);

    return httpUrl !== undefined && transcriptType !== undefined
      ? [{ type: transcriptType, url: httpUrl }]
      : [];
  });

  return mappedTranscripts.length > 0 ? mappedTranscripts : undefined;
}
