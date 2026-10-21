'use client';

import { Dot } from 'components/atoms/Dot';
import { useSettingsContext } from 'contexts/SettingsContext';
import type { PodcastEpisode } from 'types/PodcastFeed';

import { dotClassName } from './episodeUnlistenedDot.css';

interface EpisodeUnlistedDotProps {
  episode: Pick<PodcastEpisode, 'datePublished' | 'feedUrl' | 'identity'>;
}

export const EpisodeUnlistenedDot = ({ episode }: EpisodeUnlistedDotProps) => {
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

  return <Dot color={'blue'} className={dotClassName} label="New episodes" />;
};
