import Link from 'next/link';
import type { PIApiEpisodeInfo } from 'podcastdx-client/src/types';

import { Dot } from 'components/atoms/Dot';
import { Typography } from 'components/atoms/Typography';
import { Stack } from 'components/layouts/Stack';
import { FeedArtwork } from 'components/molecules/FeedArtwork';
import { useSettingsContext } from 'contexts/SettingsContext';
import { useClassNames } from 'hooks/useClassNames';
import { getEpisodeIdentity } from 'utils/getEpisodeIdentity';
import { getPodcastPath } from 'utils/paths';

import { subscriptionItemClassName } from './subscriptionItem.css';

type SubscriptionEpisode = Pick<
  PIApiEpisodeInfo,
  'datePublished' | 'enclosureUrl' | 'guid'
>;

interface SubscriptionItemProps {
  className?: string;
  feedEpisodesData?: Array<SubscriptionEpisode>;
  feedUrl: string;
  image?: string;
  title: string;
}

export const SubscriptionItem = ({
  className,
  feedEpisodesData,
  feedUrl,
  image,
  title,
}: SubscriptionItemProps) => {
  const baseClassName = useClassNames(
    subscriptionItemClassName,
    'no-underline',
    className,
  );
  const { getEpisodeSettingsItem, getFeedSettingsItem } = useSettingsContext();

  const subscribedAt = getFeedSettingsItem({ feedUrl })?.subscribedAt;

  // We say that the podcast has new episodes if there are episodes that the
  // user has not listened to that were published after the user subscribed and
  // within the last 30 days.
  const hasUnlistenedEpisodes = !!feedEpisodesData?.find((episode) => {
    const episodeIdentity = getEpisodeIdentity(
      episode.guid,
      episode.enclosureUrl,
    );

    return (
      episodeIdentity !== undefined &&
      getEpisodeSettingsItem({ episodeIdentity, feedUrl }) === undefined &&
      new Date(episode.datePublished * 1000) >
        new Date(subscribedAt ?? Infinity)
    );
  });

  return (
    <Stack
      align="center"
      as={Link}
      className={baseClassName}
      href={getPodcastPath({ feedUrl })}
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
          feedUrl={feedUrl}
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
