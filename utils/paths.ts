import type { PodcastEpisode } from 'types/PodcastFeed';
import { encodeBase64Url } from 'utils/base64Url';

type FeedReference = Pick<PodcastEpisode, 'feedUrl'>;

type EpisodeReference = FeedReference & {
  episodeIdentity: PodcastEpisode['identity'];
};

export const getPodcastPath = ({ feedUrl }: FeedReference): string => {
  return `/feeds/${encodeBase64Url(feedUrl)}`;
};

export const getEpisodePath = ({
  episodeIdentity,
  feedUrl,
}: EpisodeReference): string => {
  return `${getPodcastPath({ feedUrl })}/episodes/${encodeBase64Url(episodeIdentity)}`;
};
