import Link from 'next/link';
import type { ApiResponse } from 'podcastdx-client/src/types';
import { useQuery } from 'react-query';

import { Artwork } from 'components/atoms/Artwork';
import { Dot } from 'components/atoms/Dot';
import { Typography } from 'components/atoms/Typography';
import { Stack } from 'components/layouts/Stack';
import { useSettingsContext } from 'contexts/SettingsContext';
import { useClassNames } from 'hooks/useClassNames';
import { fetchPodcastEpisodes } from 'rest/fetchPodcastEpisodes';
import { nonUnderlinedLink } from 'styles';
import { getPodcastPath } from 'utils/paths';

import { subscriptionItemClassName } from './subscriptionItem.css';

interface ISubscriptionItemProps {
  feedId: string;
  image: string;
  title: string;
}

export const SubscriptionItem = ({
  feedId,
  image,
  title,
}: ISubscriptionItemProps) => {
  const baseClassName = useClassNames(
    subscriptionItemClassName,
    nonUnderlinedLink
  );
  const { episodeSettings, feedSettings } = useSettingsContext();
  // -30 days
  const since = -30 * 24 * 60 * 60;

  const { data } = useQuery<ApiResponse.EpisodesByFeedId | null>(
    [feedId],
    async () => await fetchPodcastEpisodes(feedId, since),
    {
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    }
  );

  const subscribedAt = feedSettings[feedId]?.subscribedAt;

  // We say that the podcast has new episodes if there are episodes that the
  // user has not listened to that were published after the user subscribed and
  // within the last 30 days.
  const hasUnlistenedEpisodes = !!data?.items.find(({ datePublished, id }) => {
    return (
      !episodeSettings[id] &&
      new Date(datePublished * 1000) > new Date(subscribedAt ?? Infinity)
    );
  });

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
        <Artwork alt="" width={80} height={80} src={image} shadow="medium" />
        <Typography as="h2" size="headingSmaller" whitespace={2}>
          {title}
        </Typography>
      </Stack>
    </Stack>
  );
};
