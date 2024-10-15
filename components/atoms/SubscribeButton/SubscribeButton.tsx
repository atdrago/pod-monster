'use client';

import type { FunctionComponent, ReactEventHandler } from 'react';

import { Button } from 'components/atoms/Button';
import { useSettingsContext } from 'contexts/SettingsContext';

interface ISubscribeButtonProps {
  feedId: number;
  feedType: 'rss' | 'atom';
  htmlUrl: string;
  image: string;
  title: string;
  xmlUrl: string;
}

export const SubscribeButton: FunctionComponent<ISubscribeButtonProps> = ({
  feedId: id,
  feedType,
  htmlUrl,
  image,
  title,
  xmlUrl,
}) => {
  const { feedSettings, setFeedSettingsItem } = useSettingsContext();

  const handleSubscribeClick: ReactEventHandler<HTMLButtonElement> = () => {
    setFeedSettingsItem(`${id}`, {
      ...feedSettings[id],
      htmlUrl,
      image,
      subscribedAt: feedSettings[id]?.subscribedAt ? null : new Date().toJSON(),
      title,
      type: feedType,
      xmlUrl,
    });
  };

  return (
    <Button onClick={handleSubscribeClick} size="medium" variant="primary">
      {feedSettings[id]?.subscribedAt ? 'Unsubscribe' : 'Subscribe'}
    </Button>
  );
};
