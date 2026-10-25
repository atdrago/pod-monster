import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { connection } from 'next/server';
import type { ComponentProps } from 'react';

import { Artwork } from 'components/atoms/Artwork';
import { Badge } from 'components/atoms/Badge';
import { Details } from 'components/atoms/Details';
import { Label } from 'components/atoms/Label';
import { Typography } from 'components/atoms/Typography';
import { Stack } from 'components/layouts/Stack';
import { EpisodeList } from 'components/molecules/EpisodeList';
import { Funding } from 'components/molecules/Funding';
import { Header } from 'components/molecules/Header';
import { decodeFeedUrlSegment, encodeBase64Url } from 'utils/base64Url';
import { createMetadata } from 'utils/createMetadata';
import { getPodcastPath, type SearchParams, toQueryString } from 'utils/paths';
import { loadShow } from 'utils/server/loadFeed';

type HeaderFeed = NonNullable<ComponentProps<typeof Header>['feed']>;

type EpisodeListEpisode = ComponentProps<
  typeof EpisodeList
>['episodes'][number];

interface PageProps {
  params: Promise<{ feedUrlBase64: string }>;
  searchParams: Promise<SearchParams>;
}

// The RSS read has a deadline of 20 seconds, and each of the two Podcast Index
// calls has a deadline of 5 seconds.
export const maxDuration = 60;

// Each client component gets only the fields that it reads. Thus, the RSC
// payload does not hold the rest of the feed or of the episodes.
const toHeaderFeed = ({ title, url }: HeaderFeed): HeaderFeed => ({
  title,
  url,
});

const toEpisodeListEpisode = ({
  datePublished,
  duration,
  episodeType,
  explicit,
  feedImage,
  feedUrl,
  identity,
  image,
  title,
}: EpisodeListEpisode): EpisodeListEpisode => ({
  datePublished,
  duration,
  episodeType,
  explicit,
  feedImage,
  feedUrl,
  identity,
  image,
  title,
});

/**
 * Returns the segment when it is the canonical base64url form of its
 * normalized feed URL. Else, redirects to the canonical path. The decoder also
 * accepts standard base64, padding, and a feed URL that is not normalized, but
 * one show must have one path. Thus, `og:url`, the key of the saved episode
 * data, and the path check of the player agree with the address bar.
 */
async function getCanonicalSegment({
  params,
  searchParams,
}: PageProps): Promise<string> {
  // Next.js passes each param through `encodeURIComponent`, so the padding of
  // standard base64 arrives as `%3D`.
  const feedUrlBase64 = decodeURIComponent((await params).feedUrlBase64);
  const feedUrl = decodeFeedUrlSegment(feedUrlBase64);

  if (feedUrl === null) {
    notFound();
  }

  if (encodeBase64Url(feedUrl) === feedUrlBase64) {
    return feedUrlBase64;
  }

  permanentRedirect(
    `${getPodcastPath({ feedUrl })}${toQueryString(await searchParams)}`,
  );
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const feedUrlBase64 = await getCanonicalSegment(props);

  await connection();

  const result = await loadShow(feedUrlBase64);

  if (result.kind === 'not_found') {
    notFound();
  }

  const { feed, isPrivate } = result;

  return createMetadata({
    description: feed.description,
    isPrivate,
    ogMetadata: {
      description: feed.description,
      image: feed.image,
      title: feed.title,
      type: 'website',
      url: getPodcastPath({ feedUrl: feed.url }),
    },
    titles: [feed.title],
  });
}

export default async function Page(props: PageProps) {
  const feedUrlBase64 = await getCanonicalSegment(props);

  await connection();

  const result = await loadShow(feedUrlBase64);

  if (result.kind === 'not_found') {
    notFound();
  }

  const { episodes, feed } = result;
  const sortedEpisodes = feed.isSerial
    ? episodes.toSorted(
        (left, right) => (left.datePublished ?? 0) - (right.datePublished ?? 0),
      )
    : episodes;

  return (
    <>
      <Header feed={toHeaderFeed(feed)} />
      <Stack as="main" maxWidth="small">
        <Stack as="article" space="small">
          <Stack kind="flexRow" space="small" align="center">
            <Artwork
              alt={`Podcast artwork for "${feed.title}"`}
              height={128}
              shadow={true}
              src={feed.image}
              width={128}
            />
            <Stack space="small">
              {feed.author ? (
                <Typography as="h3" className="font-bold" size="paragraph">
                  {feed.author}
                </Typography>
              ) : null}
              {feed.link ? (
                <Typography as="p" size="paragraph">
                  <Link
                    rel="noreferrer noopener"
                    target="_blank"
                    className="no-underline hover:underline"
                    href={feed.link}
                  >
                    {feed.link}
                  </Link>
                </Typography>
              ) : null}
              {feed.explicit ? (
                // TODO: The badge sits on a text line. This 10px text size
                // keeps the legacy height of that line. Remove it in a unit
                // that names the change.
                <div className="text-[10px]">
                  <Badge>Explicit</Badge>
                </div>
              ) : null}
            </Stack>
          </Stack>
          {feed.categories ? (
            <Stack kind="flexRow" space="xsmall" className="flex-wrap">
              {feed.categories.map((category) => (
                <Label key={category}>{category}</Label>
              ))}
            </Stack>
          ) : null}
        </Stack>
        {feed.description ? (
          <Details
            summary={
              <Typography as="h4" className="font-bold" size="headingSmaller">
                About
              </Typography>
            }
          >
            <Typography as="p" size="paragraph">
              {feed.description}
            </Typography>
          </Details>
        ) : null}
        <Funding funding={feed.funding} />
        <EpisodeList episodes={sortedEpisodes.map(toEpisodeListEpisode)} />
      </Stack>
    </>
  );
}
