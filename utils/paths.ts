import type { PodcastEpisode } from 'types/PodcastFeed';
import { encodeBase64Url } from 'utils/base64Url';

export type FeedReference = Pick<PodcastEpisode, 'feedUrl'>;

export type EpisodeReference = FeedReference & {
  episodeIdentity: PodcastEpisode['identity'];
};

export type SearchParams = Record<string, string | Array<string> | undefined>;

export const getPodcastPath = ({ feedUrl }: FeedReference): string => {
  return `/feeds/${encodeBase64Url(feedUrl)}`;
};

export const getEpisodePath = ({
  episodeIdentity,
  feedUrl,
}: EpisodeReference): string => {
  return `${getPodcastPath({ feedUrl })}/episodes/${encodeBase64Url(episodeIdentity)}`;
};

export const toQueryString = (searchParams: SearchParams): string => {
  const query = new URLSearchParams(
    Object.entries(searchParams).flatMap(([key, value]) =>
      [value ?? []].flat().map((item) => [key, item]),
    ),
  ).toString();

  return query === '' ? '' : `?${query}`;
};
