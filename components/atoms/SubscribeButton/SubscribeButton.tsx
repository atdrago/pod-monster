'use client';

import { type FunctionComponent, useState } from 'react';

import { Button } from 'components/atoms/Button';
import { useSettingsContext } from 'contexts/SettingsContext';
import type { PodcastFeed } from 'types/PodcastFeed';

interface SubscribeButtonProps {
  feed: Pick<
    PodcastFeed,
    'format' | 'image' | 'link' | 'podcastIndexId' | 'title' | 'url'
  >;
}

export const SubscribeButton: FunctionComponent<SubscribeButtonProps> = ({
  feed,
}) => {
  const { getFeedSettingsItem, isDoneHydratingFromIdb, setFeedSettingsItem } =
    useSettingsContext();
  const [isWritePending, setIsWritePending] = useState(false);
  const feedSettingsItem = getFeedSettingsItem({ feedUrl: feed.url });

  const handleSubscribeClick = async () => {
    if (!isDoneHydratingFromIdb || isWritePending) {
      return;
    }

    setIsWritePending(true);

    try {
      // A page from the RSS feed can lack a value that an earlier page from
      // Podcast Index gave. The record keeps the earlier value.
      await setFeedSettingsItem(
        { feedUrl: feed.url },
        {
          ...feedSettingsItem,
          htmlUrl: feed.link ?? feedSettingsItem?.htmlUrl,
          image: feed.image ?? feedSettingsItem?.image,
          podcastIndexId:
            feed.podcastIndexId ?? feedSettingsItem?.podcastIndexId,
          subscribedAt: feedSettingsItem?.subscribedAt
            ? null
            : new Date().toJSON(),
          title: feed.title,
          type: feed.format,
        },
      );
    } finally {
      setIsWritePending(false);
    }
  };

  return (
    <Button
      disabled={!isDoneHydratingFromIdb || isWritePending}
      onClick={handleSubscribeClick}
    >
      {feedSettingsItem?.subscribedAt ? 'Unsubscribe' : 'Subscribe'}
    </Button>
  );
};
