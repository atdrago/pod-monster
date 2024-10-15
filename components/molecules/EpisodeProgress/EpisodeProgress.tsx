'use client';

import { Progress } from 'components/molecules/Progress';
import { useMediaContext } from 'contexts/MediaContext';
import { useSettingsContext } from 'contexts/SettingsContext';
import { longDateTimeFormat, secondsToFormattedTime } from 'utils/date';

interface IEpisodeProgressProps {
  episodeDatePublished: number;
  episodeDuration?: number;
  episodeId: number;
}

export const EpisodeProgress = ({
  episodeDatePublished,
  episodeDuration,
  episodeId,
}: IEpisodeProgressProps) => {
  const { episodeId: mediaContextEpisodeId } = useMediaContext();
  const { episodeSettings } = useSettingsContext();
  const currentEpisodeSettings = episodeSettings[episodeId];

  const currentEpisodeDuration =
    currentEpisodeSettings?.duration ?? episodeDuration ?? 0;
  const currentEpisodeTime = currentEpisodeSettings?.currentTime ?? 0;

  return (
    <Progress
      topLeftTitle={longDateTimeFormat.format(
        new Date(episodeDatePublished * 1000)
      )}
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
                currentEpisodeTime
            )
          : undefined
      }
      isHighlighted={episodeId === mediaContextEpisodeId}
    />
  );
};
