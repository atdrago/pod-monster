'use client';

import { Artwork, type ArtworkComponentProps } from 'components/atoms/Artwork';
import { useSettingsContext } from 'contexts/SettingsContext';
import { useEffect } from 'react';

interface FeedArtworkProps extends ArtworkComponentProps {
  feedId: number | string;
  src: string;
}

/**
 * A component to be used for Feed artwork. Renders an Artwork component and
 * updates the feed settings with the image source if it has changed.
 */
export const FeedArtwork = ({ feedId, ...props }: FeedArtworkProps) => {
  const { feedSettings, setFeedSettingsItem } = useSettingsContext();

  useEffect(() => {
    if (props.src !== feedSettings[feedId]?.image) {
      setFeedSettingsItem(`${feedId}`, {
        ...feedSettings[feedId],
        image: props.src,
      });
    }
  }, [feedId, feedSettings, props.src, setFeedSettingsItem]);

  return <Artwork {...props} />;
};
