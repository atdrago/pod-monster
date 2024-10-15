import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  episodesByFeedId,
  getAuthValues,
  podcastsByFeedId,
} from '@atdrago/podcast-index';
import { Artwork } from 'components/atoms/Artwork';
import { Details } from 'components/atoms/Details';
import { Icon } from 'components/atoms/Icon';
import { Label } from 'components/atoms/Label';
import { SubscribeButton } from 'components/atoms/SubscribeButton';
import { Typography } from 'components/atoms/Typography';
import { Stack } from 'components/layouts/Stack';
import { EpisodeProgress } from 'components/molecules/EpisodeProgress';
import { EpisodeUnlistenedDot } from 'components/molecules/EpisodeUnlistenedDot';
import { Funding } from 'components/molecules/Funding';
import { Header } from 'components/molecules/Header';
import ExplicitIcon from 'icons/explicit.svg';
import { headingLink, nonUnderlinedLink } from 'styles';
import { createMetadata } from 'utils/createMetadata';
import { getPodcastIndexConfig } from 'utils/getPodcastIndexConfig';
import { getEpisodePath, getPodcastPath } from 'utils/paths';

/**
 * @see .next/types/app/page
 */
interface PageProps {
  params?: { feedId: string };
  searchParams?: unknown;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const feedId = typeof params?.feedId === 'string' ? params.feedId : null;

  if (!feedId) {
    notFound();
  }

  const [authTime, authToken] = getAuthValues(
    process.env.NEXT_PUBLIC_PODCAST_INDEX_API_KEY,
    process.env.NEXT_PUBLIC_PODCAST_INDEX_API_SECRET,
  );
  const config = getPodcastIndexConfig(authTime, authToken);

  const podcastsResponse = await podcastsByFeedId(feedId, config);
  const feed = podcastsResponse.feed;

  return createMetadata({
    description: feed.description,
    ogMetadata: {
      description: feed.description,
      image: feed.image,
      title: feed.title,
      type: 'website',
      url: getPodcastPath({ id: feed.id }),
    },
    titles: [feed.title],
  });
}

export default async function Page({ params }: PageProps) {
  const feedId = typeof params?.feedId === 'string' ? params.feedId : null;

  if (!feedId) {
    notFound();
  }

  const [authTime, authToken] = getAuthValues(
    process.env.NEXT_PUBLIC_PODCAST_INDEX_API_KEY,
    process.env.NEXT_PUBLIC_PODCAST_INDEX_API_SECRET,
  );
  const config = getPodcastIndexConfig(authTime, authToken);

  // -180 days (i.e., 6 months)
  const since = -180 * 24 * 60 * 60;
  const podcastsResponse = await podcastsByFeedId(feedId, config);
  const episodesResponse = await episodesByFeedId(feedId, { since }, config);
  const episodes = episodesResponse.items;
  const feed = podcastsResponse.feed;

  return (
    <>
      <Header feedId={feedId} feedTitle={feed.title} />
      <Stack as="main" maxWidth="small">
        <Stack as="article" space="small">
          <Stack kind="flexRow" space="small" align="center">
            <Artwork
              alt={`Podcast artwork for "${feed.title}"`}
              height={128}
              shadow="medium"
              src={feed.image}
              width={128}
            />
            <Stack space="small">
              <Typography as="h3" size="paragraph">
                {feed.author}
              </Typography>
              {feed.link && (
                <Typography as="p" size="paragraph">
                  <Link
                    rel="noreferrer noopener"
                    target="_blank"
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
              return (
                <Stack
                  align="center"
                  as={Link}
                  className={nonUnderlinedLink}
                  href={getEpisodePath({
                    episodeId: id,
                    feedId: feed.id,
                  })}
                  key={id}
                  kind="flexRow"
                  space="xxsmall"
                >
                  <EpisodeUnlistenedDot
                    episodeDatePublished={datePublished}
                    episodeId={id}
                    feedId={feedId}
                  />
                  <Stack align="center" space="small" kind="flexRow">
                    <Artwork
                      alt=""
                      height={80}
                      shadow="medium"
                      src={image || feedImage}
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
                      <EpisodeProgress
                        episodeDatePublished={datePublished}
                        episodeId={id}
                        episodeDuration={duration}
                      />
                    </Stack>
                  </Stack>
                </Stack>
              );
            },
          )}
        </Stack>
      </Stack>
    </>
  );
}
