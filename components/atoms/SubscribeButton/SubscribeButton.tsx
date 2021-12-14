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
  const { feedSettings, setFeedSettings } = useSettingsContext();

  const handleSubscribeClick: ReactEventHandler<HTMLButtonElement> = async (
    event
  ) => {
    if (navigator.storage && 'persist' in navigator.storage) {
      const persistent = await navigator.storage.persisted();

      if (!persistent) {
        await navigator.storage.persist();
      }
    }

    // Quick fix to prevent navigation to the episode when this button is used
    // in search result items.
    event.preventDefault();

    setFeedSettings((prevFeedSettings) => ({
      ...prevFeedSettings,
      [id]: {
        ...prevFeedSettings[id],
        htmlUrl,
        image,
        subscribedAt: prevFeedSettings[id]?.subscribedAt
          ? null
          : new Date().toJSON(),
        title,
        type: feedType,
        xmlUrl,
      },
    }));
  };

  return (
    <Button onClick={handleSubscribeClick} size="medium" variant="primary">
      {feedSettings[id]?.subscribedAt ? 'Unsubscribe' : 'Subscribe'}
    </Button>
  );
};
