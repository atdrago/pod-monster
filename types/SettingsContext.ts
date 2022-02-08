import type { Dispatch, SetStateAction } from 'react';

import type { PlaybackRate } from 'types';

export type EpisodeSettings = Record<
  string,
  {
    currentTime: number;
    duration?: number;
  }
>;

export type FeedSettings = Record<
  string,
  {
    htmlUrl?: string;
    image: string;
    /**
     * @deprecated - use `subscribedAt` instead
     */
    isSubscribed?: boolean;
    subscribedAt: string | null;
    title: string;
    type?: 'rss' | 'atom';
    xmlUrl?: string;
  }
>;

export type MediaPlayerSettings = {
  chaptersUrl: string | null;
  currentTime: number;
  dateCrawled: number | null;
  episodeId: number | null;
  episodeImage: string | null;
  episodeImageDimensions: { height: number; width: number } | null;
  episodeTitle: string | null;
  feedId: number | null;
  feedImage: string | null;
  feedTitle: string | null;
  /**
   * Should only be true for default values
   */
  isDefaults?: boolean;
  isMuted: boolean;
  /**
   * @deprecated - use `size` instead (true = 2, false = 1)
   */
  isPlayerOpen?: boolean;
  playbackRate: PlaybackRate;
  size: 1 | 2;
  src: string | null;
  srcType: string | null;
  volume: number;
};

export type LocalStorageSettings = {
  _version: number;
  audioPlayerSettings: MediaPlayerSettings;
  episodeSettings: EpisodeSettings;
  feedSettings: FeedSettings;
};

export interface ISettingsContext {
  episodeSettings: EpisodeSettings;
  feedSettings: FeedSettings;
  isDoneHydratingFromLocalStorage: boolean;
  mediaPlayerSettings?: MediaPlayerSettings;
  setEpisodeSettings: Dispatch<SetStateAction<EpisodeSettings>>;
  setFeedSettings: Dispatch<SetStateAction<FeedSettings>>;
  setMediaPlayerSettings: Dispatch<
    SetStateAction<MediaPlayerSettings | undefined>
  >;
}
