import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { connection } from 'next/server';
import rehypeParse from 'rehype-parse';
import rehypeStripHtml from 'rehype-strip-html';
import { unified } from 'unified';

import type { ImageDimensions } from 'types';
import {
  decodeBase64UrlSegment,
  decodeFeedUrlSegment,
  isCanonicalBase64UrlSegment,
} from 'utils/base64Url';
import { createMetadata } from 'utils/createMetadata';
import { getEpisodePath } from 'utils/paths';
import { loadEpisode } from 'utils/server/loadFeed';
import { probeImage } from 'utils/server/probeImage';

import { EpisodePage } from './EpisodePage';

type SearchParams = Record<string, string | Array<string> | undefined>;

interface PageProps {
  params: Promise<{ feedUrlBase64: string; guidBase64: string }>;
  searchParams: Promise<SearchParams>;
}

const SQUARE_IMAGE_DIMENSIONS: ImageDimensions = { height: 512, width: 512 };

// The RSS read and the image probe each have a deadline of 20 seconds, and
// each of the two Podcast Index calls has a deadline of 5 seconds.
export const maxDuration = 60;

function toQueryString(searchParams: SearchParams): string {
  const query = new URLSearchParams(
    Object.entries(searchParams).flatMap(([key, value]) =>
      [value ?? []].flat().map((item) => [key, item]),
    ),
  ).toString();

  return query === '' ? '' : `?${query}`;
}

/**
 * Returns the segments when each one is the canonical base64url form of its
 * value. Else, redirects to the canonical path. The decoder also accepts
 * standard base64 and padding, but one episode must have one path, so that
 * `og:url` and the path check of the player agree with the address bar.
 */
async function getCanonicalSegments({
  params,
  searchParams,
}: PageProps): Promise<Awaited<PageProps['params']>> {
  const encodedSegments = await params;
  // Next.js passes each param through `encodeURIComponent`, so the padding of
  // standard base64 arrives as `%3D`.
  const feedUrlBase64 = decodeURIComponent(encodedSegments.feedUrlBase64);
  const guidBase64 = decodeURIComponent(encodedSegments.guidBase64);

  if (
    isCanonicalBase64UrlSegment(feedUrlBase64) &&
    isCanonicalBase64UrlSegment(guidBase64)
  ) {
    return { feedUrlBase64, guidBase64 };
  }

  const feedUrl = decodeFeedUrlSegment(feedUrlBase64);
  const episodeIdentity = decodeBase64UrlSegment(guidBase64);

  if (feedUrl === null || episodeIdentity === null) {
    notFound();
  }

  permanentRedirect(
    `${getEpisodePath({ episodeIdentity, feedUrl })}${toQueryString(await searchParams)}`,
  );
}

async function toPlainText(html: string): Promise<string> {
  const plainTextFile = await unified()
    .use(rehypeParse)
    .use(rehypeStripHtml)
    .process(html);

  return String(plainTextFile).replace(/\s+/g, ' ');
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { feedUrlBase64, guidBase64 } = await getCanonicalSegments(props);

  await connection();

  const result = await loadEpisode(feedUrlBase64, guidBase64);

  if (result.kind === 'not_found') {
    notFound();
  }

  const { episode, isPrivate } = result;
  const isVideo = episode.enclosureType?.includes('video') ?? false;
  const description =
    episode.description === undefined
      ? undefined
      : await toPlainText(episode.description);

  return createMetadata({
    description,
    isPrivate,
    ogMetadata: {
      audio: isVideo ? undefined : episode.enclosureUrl,
      description,
      image: episode.image ?? episode.feedImage,
      title: episode.title,
      type: 'website',
      url: getEpisodePath({
        episodeIdentity: episode.identity,
        feedUrl: episode.feedUrl,
      }),
      video: isVideo ? episode.enclosureUrl : undefined,
    },
    titles: [episode.title, episode.feedTitle],
  });
}

export default async function Page(props: PageProps) {
  const { feedUrlBase64, guidBase64 } = await getCanonicalSegments(props);

  await connection();

  const result = await loadEpisode(feedUrlBase64, guidBase64);

  if (result.kind === 'not_found') {
    notFound();
  }

  const { episode, feed } = result;
  const { t: startTime } = await props.searchParams;
  const imageUrl = episode.image ?? episode.feedImage;
  const imageSize = imageUrl === undefined ? null : await probeImage(imageUrl);
  // The page shows a square image at 512 by 512, the same as an image that
  // the probe cannot read.
  const episodeImageDimensions =
    imageSize !== null && imageSize.height !== imageSize.width
      ? imageSize
      : SQUARE_IMAGE_DIMENSIONS;

  return (
    <EpisodePage
      episode={episode}
      episodeImageDimensions={episodeImageDimensions}
      feed={feed}
      t={typeof startTime === 'string' ? startTime : undefined}
    />
  );
}
