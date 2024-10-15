import type { DBSchema } from 'idb';
import type { Dispatch, SetStateAction } from 'react';

import type { PlaybackRate } from 'types';

export interface EpisodeSettingsItem {
  currentTime: number;
  duration?: number;
}

export type EpisodeSettings = Record<string, EpisodeSettingsItem>;

export interface FeedSettingsItem {
  htmlUrl?: string;
  image: string;
  subscribedAt: string | null;
  title: string;
  type?: 'rss' | 'atom';
  xmlUrl?: string;
}

export type FeedSettings = Record<string, FeedSettingsItem>;

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
  isMuted: boolean;
  isTranscriptVisibleAsSubtitle: boolean;
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

export interface PodMonsterDb extends DBSchema {
  episodeSettings: {
    /** episodeId */
    key: string;
    value: EpisodeSettingsItem;
  };
  feedSettings: {
    /** feedId */
    key: string;
    value: FeedSettingsItem;
  };
  mediaPlayerSettings: {
    key: 'mediaPlayerSettings';
    value: MediaPlayerSettings;
  };
}

export interface SettingsContext {
  episodeSettings: EpisodeSettings;
  feedSettings: FeedSettings;
  idbHydrationPromise: Promise<void> | null;
  isDoneHydratingFromIdb: boolean;
  mediaPlayerSettings?: MediaPlayerSettings;
  setAllFeedSettings: (feedSettings: FeedSettings) => Promise<void>;
  setEpisodeSettingsItem: (
    key: string,
    value: EpisodeSettingsItem,
  ) => Promise<void>;
  setFeedSettingsItem: (key: string, value: FeedSettingsItem) => Promise<void>;
  setMediaPlayerSettings: Dispatch<
    SetStateAction<MediaPlayerSettings | undefined>
  >;
}
