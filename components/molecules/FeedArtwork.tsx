'use client';

import { Artwork, type ArtworkComponentProps } from 'components/atoms/Artwork';
import { useSettingsContext } from 'contexts/SettingsContext';
import { useEffect } from 'react';

import type { PodcastEpisode } from 'types/PodcastFeed';

type FeedArtworkProps = ArtworkComponentProps & Pick<PodcastEpisode, 'feedUrl'>;

/**
 * Renders the artwork of a show. When the show is in the library, it also
 * saves a changed image to the library record. A visit to a show that is not
 * in the library writes nothing, so a private feed URL does not go to storage.
 */
export const FeedArtwork = ({ feedUrl, ...props }: FeedArtworkProps) => {
  const { getFeedSettingsItem, setFeedSettingsItem } = useSettingsContext();
  const { src } = props;

  useEffect(() => {
    const existing = getFeedSettingsItem({ feedUrl });

    if (src !== undefined && existing !== undefined && existing.image !== src) {
      setFeedSettingsItem({ feedUrl }, { ...existing, image: src });
    }
  }, [feedUrl, getFeedSettingsItem, setFeedSettingsItem, src]);

  return <Artwork {...props} />;
};
