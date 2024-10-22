import { captureException } from '@sentry/nextjs';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import probeImageSize from 'probe-image-size';
import rehypeParse from 'rehype-parse';
import rehypeStripHtml from 'rehype-strip-html';
import { unified } from 'unified';

import {
  episodeById,
  getAuthValues,
  podcastsByFeedId,
} from '@atdrago/podcast-index';
import { createMetadata } from 'utils/createMetadata';
import { getPodcastIndexConfig } from 'utils/getPodcastIndexConfig';
import { getEpisodePath } from 'utils/paths';
import { toTitleCase } from 'utils/toTitleCase';

import { EpisodePage } from './EpisodePage';

/**
 * @see .next/types/app/page
 */
interface PageProps {
  params?: Promise<{ episodeId: string; feedId: string }>;
  searchParams?: Promise<unknown>;
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params;
  const feedId = typeof params?.feedId === 'string' ? params.feedId : null;
  const episodeId =
    typeof params?.episodeId === 'string' ? params.episodeId : null;

  if (!feedId || !episodeId) {
    notFound();
  }

  const [authTime, authToken] = getAuthValues(
    process.env.NEXT_PUBLIC_PODCAST_INDEX_API_KEY,
    process.env.NEXT_PUBLIC_PODCAST_INDEX_API_SECRET,
  );
  const config = getPodcastIndexConfig(authTime, authToken);

  const episodeResponse = await episodeById(episodeId, config);
  const episode = episodeResponse.episode;
  const isVideo = episode?.enclosureType.includes('video');

  const descriptionRawFile = await unified()
    .use(rehypeParse)
    .use(rehypeStripHtml)
    .process(episode.description);

  const descriptionRaw = String(descriptionRawFile).replace(/\s+/g, ' ');
  const episodeArtwork = episode?.image ?? episode?.feedImage ?? '';

  return createMetadata({
    description: descriptionRaw ?? episode.description,
    ogMetadata: {
      audio: isVideo ? undefined : episode.enclosureUrl,
      description: descriptionRaw,
      image: episodeArtwork,
      title: episode.title,
      type: 'website',
      url: getEpisodePath({
        episodeId,
        feedId,
      }),
      video: isVideo ? episode.enclosureUrl : undefined,
    },
    titles: [episode.title, episode.feedTitle],
  });
}

export default async function Page(props: PageProps) {
  const params = await props.params;
  const feedId = typeof params?.feedId === 'string' ? params.feedId : null;
  const episodeId =
    typeof params?.episodeId === 'string' ? params.episodeId : null;

  if (!feedId || !episodeId) {
    notFound();
  }

  const [authTime, authToken] = getAuthValues(
    process.env.NEXT_PUBLIC_PODCAST_INDEX_API_KEY,
    process.env.NEXT_PUBLIC_PODCAST_INDEX_API_SECRET,
  );
  const config = getPodcastIndexConfig(authTime, authToken);

  const podcastsResponse = await podcastsByFeedId(feedId, config);
  const episodeResponse = await episodeById(episodeId, config);
  const feed = podcastsResponse.feed;
  const episode = episodeResponse.episode;

  const episodeImageDimensions = {
    height: 512,
    width: 512,
  };

  try {
    const { height, width } = await probeImageSize(
      episode.image || episode.feedImage,
    );

    // If the image is a square, keep the dimensions at 512x512
    if (height !== width) {
      episodeImageDimensions.height = height;
      episodeImageDimensions.width = width;
    }
  } catch (err) {
    captureException(err, {
      extra: {
        episodeId,
        feedId,
        feedImage: episode.feedImage,
        image: episode.image,
      },
    });
  }

  // Setup person proxy image paths and sorting on the server
  if (episode.persons && episode.persons.length > 0) {
    episode.persons = episode.persons
      .map((person) => {
        /**
         * If `role` is missing, "host" should be assumed, and if `group` is
         * missing, "cast" should be assumed
         * @see https://github.com/Podcastindex-org/podcast-namespace/blob/main/docs/1.0.md#person
         */
        const nextPerson = {
          ...person,
          group: toTitleCase(person.group || 'cast'),
          role: toTitleCase(person.role || 'host'),
        };

        if (person.img) {
          nextPerson.img = person.img;
        }

        return nextPerson;
      })
      .sort((personA, personB) => {
        if (personA.role === personB.role) {
          return personA.name < personB.name ? -1 : 1;
        }

        return personA.role === 'Host' ? -1 : 1;
      });
  }

  return (
    <EpisodePage
      episode={episode}
      episodeImageDimensions={episodeImageDimensions}
      feedFunding={feed.funding ?? null}
      feedLink={feed.link}
      feedType={feed.type === 0 ? 'rss' : 'atom'}
      feedUrl={feed.url}
    />
  );
}
