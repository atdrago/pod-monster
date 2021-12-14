import type { GetStaticPaths, NextPage } from 'next';

import { Artwork } from 'components/atoms/Artwork';
import { Details } from 'components/atoms/Details';
import { Dot } from 'components/atoms/Dot';
import { Head } from 'components/atoms/Head';
import { Label } from 'components/atoms/Label';
import { Link } from 'components/atoms/Link';
import { SubscribeButton } from 'components/atoms/SubscribeButton';
import { Typography } from 'components/atoms/Typography';
import { Stack } from 'components/layouts/Stack';
import { useSettingsContext } from 'contexts/SettingsContext';
import { useClassNames } from 'hooks/useClassNames';
import { fetchPodcastIndexAuth } from 'rest/fetchPodcastIndexAuth';
import { headingLink, nonUnderlinedLink } from 'styles';
import { episodeItemClassName } from 'styles/feed.css';
import type { IPodcastPageProps, PodcastPageGetStaticProps } from 'types';
import { noteDateTimeFormat } from 'utils/date';
import { getPodcastIndexConfig } from 'utils/getPodcastIndexConfig';
import { getEpisodePath } from 'utils/paths';
import { episodesByFeedId, podcastsByFeedId } from 'utils/podcastIndex';

export const getStaticProps: PodcastPageGetStaticProps = async ({ params }) => {
  const feedId = typeof params?.feedId === 'string' ? params.feedId : null;

  if (!feedId) {
    return { notFound: true };
  }

  const [authTime, authToken] = await fetchPodcastIndexAuth();
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

  const baseClassName = useClassNames(episodeItemClassName, nonUnderlinedLink);

  const subscribedAt = feedSettings[feed.id]?.subscribedAt;
  const proxyFeedImage = new URL(
    '/api/images/proxy',
    process.env.NEXT_PUBLIC_BASE_URL
  );

  proxyFeedImage.searchParams.set('url', feed.image ?? '');

  return (
    <>
      <Head titles={[feed.title]} description={feed.description} />
      <Stack as="main" maxWidth="small">
        <Stack as="article" space="small">
          <Stack kind="flexRow" space="small" align="center">
            <Artwork
              alt={`Podcast artwork for "${feed.title}"`}
              height={128}
              shadow="medium"
              src={proxyFeedImage.toString()}
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
        {feed.funding && (
          <Stack space="small">
            <Typography as="h4" size="headingSmaller">
              Donations
            </Typography>
            <Typography as="p" size="paragraph">
              <Link
                anchorProps={{
                  rel: 'noreferrer noopener',
                  target: '_blank',
                }}
                className={headingLink}
                href={feed.funding.url}
              >
                {feed.funding.message}
              </Link>
            </Typography>
          </Stack>
        )}
        <Stack space="small">
          <Typography as="h4" size="headingSmaller">
            Episodes
          </Typography>
          {episodes.map(({ datePublished, feedImage, id, image, title }) => {
            const proxyImage = new URL(
              '/api/images/proxy',
              process.env.NEXT_PUBLIC_BASE_URL
            );

            proxyImage.searchParams.set('url', image || feedImage);

            const isUnlistened =
              !episodeSettings[id] &&
              new Date(datePublished * 1000) >
                new Date(subscribedAt ?? Infinity);

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
                <Dot
                  color={isUnlistened ? 'blue' : 'transparent'}
                  label="New episodes"
                />
                <Stack align="center" space="small" kind="flexRow">
                  <Artwork
                    alt=""
                    height={80}
                    shadow="medium"
                    src={proxyImage.toString()}
                    width={80}
                  />
                  <Stack
                    space="small"
                    style={{ overflowY: 'hidden', padding: '4px 0' }}
                  >
                    <Typography
                      as="h3"
                      size="headingSmaller"
                      whitespace="ellipsis"
                    >
                      {title}
                    </Typography>
                    <Typography as="p" size="paragraph" whitespace="ellipsis">
                      {noteDateTimeFormat.format(
                        new Date(datePublished * 1000)
                      )}
                    </Typography>
                  </Stack>
                </Stack>
              </Stack>
            );
          })}
        </Stack>
      </Stack>
    </>
  );
};

export default PodcastPage;
