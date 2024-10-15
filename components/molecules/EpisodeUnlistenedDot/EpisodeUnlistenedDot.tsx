'use client';

import { Dot } from 'components/atoms/Dot';
import { useSettingsContext } from 'contexts/SettingsContext';

import { dotClassName } from './episodeUnlistenedDot.css';

interface IEpisodeUUnlistedDotProps {
  episodeDatePublished: number;
  episodeId: number;
  feedId: number | string;
}

export const EpisodeUnlistenedDot = ({
  episodeDatePublished,
  episodeId,
  feedId,
}: IEpisodeUUnlistedDotProps) => {
  const { episodeSettings, feedSettings } = useSettingsContext();
  const subscribedAt = feedSettings[feedId]?.subscribedAt;
  const currentEpisodeSettings = episodeSettings[episodeId];
  const isUnlistened =
    !currentEpisodeSettings &&
    new Date(episodeDatePublished * 1000) > new Date(subscribedAt ?? Infinity);

  if (!isUnlistened) {
    return null;
  }

  return <Dot color={'blue'} className={dotClassName} label="New episodes" />;
};
