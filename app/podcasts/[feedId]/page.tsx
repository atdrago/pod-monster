import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  episodesByFeedId,
  getAuthValues,
  podcastsByFeedId,
} from '@atdrago/podcast-index';
import { Details } from 'components/atoms/Details';
import { Badge } from 'components/atoms/Badge';
import { Label } from 'components/atoms/Label';
import { SubscribeButton } from 'components/atoms/SubscribeButton';
import { Typography } from 'components/atoms/Typography';
import { Stack } from 'components/layouts/Stack';
import { EpisodeList } from 'components/molecules/EpisodeList';
import { FeedArtwork } from 'components/molecules/FeedArtwork';
import { Funding } from 'components/molecules/Funding';
import { Header } from 'components/molecules/Header';
import { headingLink } from 'styles';
import { createMetadata } from 'utils/createMetadata';
import { getPodcastIndexConfig } from 'utils/getPodcastIndexConfig';
import { getPodcastPath } from 'utils/paths';

/**
 * @see .next/types/app/page
 */
interface PageProps {
  params?: Promise<{ feedId: string }>;
  searchParams?: Promise<unknown>;
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params;
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

export default async function Page(props: PageProps) {
  const params = await props.params;
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
  const isSerial = feed.itunesType === 'serial';

  const episodesResponse = await episodesByFeedId(feedId, {}, config);
  const episodes = isSerial
    ? episodesResponse.items.toSorted(
        (a, b) => a.datePublished - b.datePublished,
      )
    : episodesResponse.items;

  return (
    <>
      <Header feedId={feedId} feedTitle={feed.title} />
      <Stack as="main" maxWidth="small">
        <Stack as="article" space="small">
          <Stack kind="flexRow" space="small" align="center">
            <FeedArtwork
              alt={`Podcast artwork for "${feed.title}"`}
              height={128}
              shadow="medium"
              src={feed.image}
              feedId={feed.id}
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
                  <Badge>Explicit</Badge>
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
        <EpisodeList episodes={episodes} feedId={feed.id} />
      </Stack>
    </>
  );
}
