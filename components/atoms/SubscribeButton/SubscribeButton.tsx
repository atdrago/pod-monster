import type { FunctionComponent } from 'react';

import { Button } from 'components/atoms/Button';
import { useSettingsContext } from 'contexts/SettingsContext';

interface ISubscribeButtonProps {
  feedId: number;
  image: string;
  title: string;
}

export const SubscribeButton: FunctionComponent<ISubscribeButtonProps> = ({
  feedId: id,
  image,
  title,
}) => {
  const { feedSettings, setFeedSettings } = useSettingsContext();

  const handleSubscribeClick = () => {
    setFeedSettings((prevFeedSettings) => ({
      ...prevFeedSettings,
      [id]: {
        ...prevFeedSettings[id],
        image,
        isSubscribed: !feedSettings[id]?.isSubscribed,
        title,
      },
    }));
  };

  return (
    <Button onClick={handleSubscribeClick} size="medium" variant="primary">
      {feedSettings[id]?.isSubscribed ? 'Unsubscribe' : 'Subscribe'}
    </Button>
  );
};
