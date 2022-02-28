import type { GetStaticPaths, NextPage } from 'next';

import {
  episodesByFeedId,
  getAuthValues,
  podcastsByFeedId,
} from '@atdrago/podcast-index';
import { Artwork } from 'components/atoms/Artwork';
import { Details } from 'components/atoms/Details';
import { Dot } from 'components/atoms/Dot';
import { Head } from 'components/atoms/Head';
import { Icon } from 'components/atoms/Icon';
import { Label } from 'components/atoms/Label';
import { Link } from 'components/atoms/Link';
import { SubscribeButton } from 'components/atoms/SubscribeButton';
import { Typography } from 'components/atoms/Typography';
import { Stack } from 'components/layouts/Stack';
import { Funding } from 'components/molecules/Funding';
import { Progress } from 'components/molecules/Progress';
import { useMediaContext } from 'contexts/MediaContext';
import { useSettingsContext } from 'contexts/SettingsContext';
import { useClassNames } from 'hooks/useClassNames';
import ExplicitIcon from 'icons/explicit.svg';
import { headingLink, nonUnderlinedLink } from 'styles';
import { episodeItemClassName } from 'styles/feed.css';
import type { IPodcastPageProps, PodcastPageGetStaticProps } from 'types';
import { longDateTimeFormat, secondsToFormattedTime } from 'utils/date';
import { getPodcastIndexConfig } from 'utils/getPodcastIndexConfig';
import { getProxyImageUrl } from 'utils/getProxyImageUrl';
import { getEpisodePath, getPodcastPath } from 'utils/paths';

export const getStaticProps: PodcastPageGetStaticProps = async ({ params }) => {
  const feedId = typeof params?.feedId === 'string' ? params.feedId : null;

  if (!feedId) {
    return { notFound: true };
  }

  const [authTime, authToken] = getAuthValues(
    process.env.NEXT_PUBLIC_PODCAST_INDEX_API_KEY,
    process.env.NEXT_PUBLIC_PODCAST_INDEX_API_SECRET
  );
  const config = getPodcastIndexConfig(authTime, authToken);

  // -180 days (i.e., 6 months)
  const since = -180 * 24 * 60 * 60;
  const podcastsResponse = await podcastsByFeedId(feedId, config);
  const episodesResponse = await episodesByFeedId(feedId, { since }, config);

  return {
    props: {
      episodes: episodesResponse.items,
      feed: podcastsResponse.feed,
    },
    // one hour, in seconds
    revalidate: 3600,
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    fallback: 'blocking',
    paths: [],
  };
};

const PodcastPage: NextPage<IPodcastPageProps> = ({ episodes, feed }) => {
  const { episodeSettings, feedSettings } = useSettingsContext();
  const { episodeId } = useMediaContext();

  const baseClassName = useClassNames(nonUnderlinedLink);

  const subscribedAt = feedSettings[feed.id]?.subscribedAt;

  return (
    <>
      <Head
        titles={[feed.title]}
        description={feed.description}
        ogMetadata={{
          description: feed.description,
          image: feed.image,
          title: feed.title,
          type: 'website',
          url: getPodcastPath({ id: feed.id }),
        }}
      />
      <Stack as="main" maxWidth="small">
        <Stack as="article" space="small">
          <Stack kind="flexRow" space="small" align="center">
            <Artwork
              alt={`Podcast artwork for "${feed.title}"`}
              height={128}
              shadow="medium"
              src={getProxyImageUrl(feed.image)}
              width={128}
            />
            <Stack space="small">
              <Typography as="h3" size="paragraph">
                {feed.author}
              </Typography>
              {feed.link && (
                <Typography as="p" size="paragraph">
                  <Link
                    anchorProps={{
                      rel: 'noreferrer noopener',
                      target: '_blank',
                    }}
                    className={headingLink}
                    href={feed.link}
                  >
                    {feed.link}
                  </Link>
                </Typography>
              )}
              {feed.explicit ? (
                <div>
                  <Label>Explicit</Label>
                </div>
              ) : null}
            </Stack>
          </Stack>
          {feed.categories && (
            <Stack kind="flexRow" space="xsmall" style={{ flexWrap: 'wrap' }}>
              {Object.entries(feed.categories).map(([key, value]) => {
                return <Label key={key}>{value}</Label>;
              })}
            </Stack>
          )}
          <SubscribeButton
            feedId={feed.id}
            feedType={feed.type === 0 ? 'rss' : 'atom'}
            htmlUrl={feed.link}
            image={feed.image}
            title={feed.title}
            xmlUrl={feed.url}
          />
        </Stack>
        <Details
          summary={
            <Typography as="h4" size="headingSmaller">
              About
            </Typography>
          }
        >
          <Typography as="p" size="paragraph">
            {feed.description}
          </Typography>
        </Details>
        <Funding funding={feed.funding}></Funding>
        <Stack space="small">
          <Typography as="h4" size="headingSmaller">
            Episodes
          </Typography>
          {episodes.map(
            ({
              datePublished,
              duration,
              explicit,
              feedImage,
              id,
              image,
              title,
            }) => {
              const currentEpisodeSettings = episodeSettings[id];
              const isUnlistened =
                !currentEpisodeSettings &&
                new Date(datePublished * 1000) >
                  new Date(subscribedAt ?? Infinity);

              const currentEpisodeDuration =
                currentEpisodeSettings?.duration ?? duration ?? 0;
              const currentEpisodeTime =
                currentEpisodeSettings?.currentTime ?? 0;

              return (
                <Stack
                  align="center"
                  as={Link}
                  className={baseClassName}
                  href={getEpisodePath({
                    episodeId: id,
                    feedId: feed.id,
                  })}
                  key={id}
                  kind="flexRow"
                  space="xxsmall"
                >
                  {isUnlistened ? (
                    <Dot
                      color={'blue'}
                      className={episodeItemClassName}
                      label="New episodes"
                    />
                  ) : null}
                  <Stack align="center" space="small" kind="flexRow">
                    <Artwork
                      alt=""
                      height={80}
                      shadow="medium"
                      src={getProxyImageUrl(image || feedImage)}
                      width={80}
                    />
                    <Stack
                      space="xsmall"
                      style={{ overflowY: 'hidden', padding: '4px 0' }}
                    >
                      <Stack kind="flexRow" space="xxsmall" align="center">
                        {explicit > 0 ? (
                          <Icon
                            style={{ verticalAlign: 'middle' }}
                            as={ExplicitIcon}
                            size="smallMedium"
                          />
                        ) : null}{' '}
                        <Typography
                          as="h3"
                          size="headingSmaller"
                          shouldUseCapsize={false}
                          whitespace="ellipsis"
                        >
                          {title}
                        </Typography>
                      </Stack>
                      <Progress
                        topLeftTitle={longDateTimeFormat.format(
                          new Date(datePublished * 1000)
                        )}
                        percent={
                          currentEpisodeDuration > 0
                            ? currentEpisodeTime / currentEpisodeDuration
                            : undefined
                        }
                        bottomLeftTitle={
                          currentEpisodeDuration > 0
                            ? secondsToFormattedTime(currentEpisodeTime)
                            : undefined
                        }
                        bottomRightTitle={
                          currentEpisodeDuration > 0
                            ? secondsToFormattedTime(
                                Math.max(
                                  currentEpisodeDuration,
                                  currentEpisodeTime
                                ) - currentEpisodeTime
                              )
                            : undefined
                        }
                        isHighlighted={episodeId === id}
                      />
                    </Stack>
                  </Stack>
                </Stack>
              );
            }
          )}
        </Stack>
      </Stack>
    </>
  );
};

export default PodcastPage;
