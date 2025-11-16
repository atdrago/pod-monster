import Link from 'next/link';
import type { PIApiEpisodeInfo } from 'podcastdx-client/src/types';

import { Dot } from 'components/atoms/Dot';
import { Typography } from 'components/atoms/Typography';
import { Stack } from 'components/layouts/Stack';
import { FeedArtwork } from 'components/molecules/FeedArtwork';
import { useSettingsContext } from 'contexts/SettingsContext';
import { useClassNames } from 'hooks/useClassNames';
import { nonUnderlinedLink } from 'styles';
import { getPodcastPath } from 'utils/paths';

import { subscriptionItemClassName } from './subscriptionItem.css';

interface SubscriptionItemProps {
  feedEpisodesData?: Array<PIApiEpisodeInfo>;
  feedId: string;
  image: string;
  title: string;
}

export const SubscriptionItem = ({
  feedEpisodesData,
  feedId,
  image,
  title,
}: SubscriptionItemProps) => {
  const baseClassName = useClassNames(
    subscriptionItemClassName,
    nonUnderlinedLink,
  );
  const { episodeSettings, feedSettings } = useSettingsContext();

  const subscribedAt = feedSettings[feedId]?.subscribedAt;

  // We say that the podcast has new episodes if there are episodes that the
  // user has not listened to that were published after the user subscribed and
  // within the last 30 days.
  const hasUnlistenedEpisodes = !!feedEpisodesData?.find(
    ({ datePublished, id }) => {
      return (
        !episodeSettings[id] &&
        new Date(datePublished * 1000) > new Date(subscribedAt ?? Infinity)
      );
    },
  );

  return (
    <Stack
      align="center"
      as={Link}
      className={baseClassName}
      href={getPodcastPath({ id: `${feedId}` })}
      key={feedId}
      kind="flexRow"
      space="xxsmall"
    >
      <Dot
        aria-hidden={!hasUnlistenedEpisodes}
        color={hasUnlistenedEpisodes ? 'blue' : 'transparent'}
        label="New episodes."
      />
      <Stack align="center" space="small" kind="flexRow">
        <FeedArtwork
          alt=""
          feedId={feedId}
          height={80}
          shadow={true}
          src={image}
          width={80}
        />
        <Typography
          as="h2"
          className="font-bold"
          size="headingSmaller"
          whitespace={2}
        >
          {title}
        </Typography>
      </Stack>
    </Stack>
  );
};
