import Link from 'next/link';
import type { PIApiEpisodeInfo } from 'podcastdx-client/src/types';

import { Dot } from 'components/atoms/Dot';
import { Typography } from 'components/atoms/Typography';
import { Stack } from 'components/layouts/Stack';
import { FeedArtwork } from 'components/molecules/FeedArtwork';
import { useSettingsContext } from 'contexts/SettingsContext';
import { getEpisodeIdentity } from 'utils/getEpisodeIdentity';
import { getPodcastPath } from 'utils/paths';

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

  // The negative margin equals the dot width and the `xxsmall` gap. Thus, the
  // dot hangs in the gutter, and the artwork aligns with the content edge.
  return (
    <Stack
      align="center"
      as={Link}
      className={`-ml-3 no-underline ${className ?? ''}`}
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
          shouldTrimTextBox={false}
          size="headingSmaller"
          whitespace={2}
        >
          {title}
        </Typography>
      </Stack>
    </Stack>
  );
};
