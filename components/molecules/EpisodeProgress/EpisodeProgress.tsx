'use client';

import { Progress } from 'components/molecules/Progress';
import { useMediaContext } from 'contexts/MediaContext';
import { useSettingsContext } from 'contexts/SettingsContext';
import type { PodcastEpisode } from 'types/PodcastFeed';
import { longDateTimeFormat, secondsToFormattedTime } from 'utils/date';

interface EpisodeProgressProps {
  episode: Pick<
    PodcastEpisode,
    'datePublished' | 'duration' | 'feedUrl' | 'identity'
  >;
}

export const EpisodeProgress = ({ episode }: EpisodeProgressProps) => {
  const { episodeIdentity, feedUrl } = useMediaContext();
  const { getEpisodeSettingsItem } = useSettingsContext();
  const currentEpisodeSettings = getEpisodeSettingsItem({
    episodeIdentity: episode.identity,
    feedUrl: episode.feedUrl,
  });

  const currentEpisodeDuration =
    currentEpisodeSettings?.duration ?? episode.duration ?? 0;
  const currentEpisodeTime = currentEpisodeSettings?.currentTime ?? 0;

  return (
    <Progress
      topLeftTitle={
        episode.datePublished === undefined
          ? undefined
          : longDateTimeFormat.format(new Date(episode.datePublished * 1000))
      }
      percent={
        currentEpisodeDuration > 0
          ? currentEpisodeTime / currentEpisodeDuration
          : undefined
      }
      bottomLeftTitle={
        currentEpisodeDuration > 0
          ? secondsToFormattedTime(currentEpisodeTime)
          : undefined
      }
      bottomRightTitle={
        currentEpisodeDuration > 0
          ? secondsToFormattedTime(
              Math.max(currentEpisodeDuration, currentEpisodeTime) -
                currentEpisodeTime,
            )
          : undefined
      }
      isHighlighted={
        episode.identity === episodeIdentity && episode.feedUrl === feedUrl
      }
    />
  );
};
