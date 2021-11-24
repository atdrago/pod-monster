import type { GetStaticPaths, NextPage } from 'next';
import Head from 'next/head';

import { Artwork } from 'components/atoms/Artwork';
import { Blockquote } from 'components/atoms/Blockquote';
import { Label } from 'components/atoms/Label';
import { Link } from 'components/atoms/Link';
import { SubscribeButton } from 'components/atoms/SubscribeButton';
import { Typography } from 'components/atoms/Typography';
import { Stack } from 'components/layouts/Stack';
import { Header } from 'components/molecules/Header';
import { fetchPodcastIndexAuth } from 'rest/fetchPodcastIndexAuth';
import { headingLink } from 'styles';
import type { IPodcastPageProps, PodcastPageGetStaticProps } from 'types';
import { noteDateTimeFormat } from 'utils/date';
import { getPodcastIndexConfig } from 'utils/getPodcastIndexConfig';
import { episodesByFeedId, podcastsByFeedId } from 'utils/podcastIndex';

export const getStaticProps: PodcastPageGetStaticProps = async ({ params }) => {
  const feedId = typeof params?.feedId === 'string' ? params.feedId : null;

  if (!feedId) {
    return { notFound: true };
  }

  const [authTime, authToken] = await fetchPodcastIndexAuth();
  const config = getPodcastIndexConfig(authTime, authToken);

  // -2 years
  const since = -2 * 365 * 24 * 60 * 60;
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
  const proxyFeedImage = new URL(
    '/api/images/proxy',
    process.env.NEXT_PUBLIC_BASE_URL
  );

  proxyFeedImage.searchParams.set('url', feed.image ?? '');

  return (
    <>
      <Head>
        <title>{feed.title} - podcast.fish</title>
        <meta name="description" content={feed.description} />
      </Head>
      <Stack as="main" maxWidth="small">
        <Stack space="small">
          <Header feedId={feed.id} feedTitle={feed.title} />
          <Stack kind="flexRow" space="small" align="center">
            <Artwork width={128} height={128} src={proxyFeedImage.toString()} />
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
            </Stack>
          </Stack>
          <SubscribeButton
            feedId={feed.id}
            image={feed.image}
            title={feed.title}
          />
          <div>
            <Label>{feed.explicit ? 'Explicit' : 'Clean'}</Label>
          </div>
          <Stack space="xsmall">
            {feed.categories && (
              <Stack kind="flexRow" space="xsmall" style={{ flexWrap: 'wrap' }}>
                {Object.entries(feed.categories).map(([key, value]) => {
                  return <Label key={key}>{value}</Label>;
                })}
              </Stack>
            )}
          </Stack>
          <Blockquote>
            <Typography as="p" size="paragraph">
              {feed.description}
            </Typography>
          </Blockquote>
        </Stack>
        {feed.funding && (
          <Stack space="small">
            <Typography as="h4" size="headingSmall">
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
          <Typography as="h4" size="headingSmall">
            Episodes
          </Typography>
          {episodes.map((episode) => {
            const proxyImage = new URL(
              '/api/images/proxy',
              process.env.NEXT_PUBLIC_BASE_URL
            );

            proxyImage.searchParams.set(
              'url',
              episode.image || episode.feedImage
            );

            return (
              <Stack
                align="center"
                as="article"
                key={episode.id}
                kind="flexRow"
                space="small"
              >
                <Artwork
                  alt=""
                  width={80}
                  height={80}
                  src={proxyImage.toString()}
                />
                <Stack
                  space="small"
                  style={{ overflowY: 'hidden', padding: '4px 0' }}
                >
                  <Link
                    className={headingLink}
                    href={`/podcasts/${feed.id}/episodes/${episode.id}`}
                  >
                    <Typography
                      as="h3"
                      size="headingSmaller"
                      whitespace="ellipsis"
                    >
                      {episode.title}
                    </Typography>
                  </Link>
                  <Typography as="p" size="paragraph" whitespace="ellipsis">
                    {noteDateTimeFormat.format(
                      new Date(episode.datePublished * 1000)
                    )}
                  </Typography>
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
