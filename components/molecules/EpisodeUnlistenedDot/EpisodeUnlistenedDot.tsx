'use client';

import { Dot } from 'components/atoms/Dot';
import { useSettingsContext } from 'contexts/SettingsContext';
import type { PodcastEpisode } from 'types/PodcastFeed';

interface EpisodeUnlistedDotProps {
  className?: string;
  episode: Pick<PodcastEpisode, 'datePublished' | 'feedUrl' | 'identity'>;
}

export const EpisodeUnlistenedDot = ({
  className,
  episode,
}: EpisodeUnlistedDotProps) => {
  const { getEpisodeSettingsItem, getFeedSettingsItem } = useSettingsContext();
  const subscribedAt = getFeedSettingsItem({
    feedUrl: episode.feedUrl,
  })?.subscribedAt;
  const currentEpisodeSettings = getEpisodeSettingsItem({
    episodeIdentity: episode.identity,
    feedUrl: episode.feedUrl,
  });
  const isUnlistened =
    currentEpisodeSettings === undefined &&
    episode.datePublished !== undefined &&
    new Date(episode.datePublished * 1000) > new Date(subscribedAt ?? Infinity);

  if (!isUnlistened) {
    return null;
  }

  // The negative margin equals the dot width and the `xxsmall` gap. Thus, the
  // dot hangs in the gutter, and the artwork aligns with the content edge.
  return (
    <Dot
      color={'blue'}
      className={`-ml-3 ${className ?? ''}`}
      label="New episodes"
    />
  );
};
