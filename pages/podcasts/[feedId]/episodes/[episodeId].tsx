import type { GetStaticPaths, NextPage } from 'next';
import probeImageSize from 'probe-image-size';
import { useEffect, useState } from 'react';
import ReactDomServer from 'react-dom/server';
import { useQuery } from 'react-query';
import rehypeParse from 'rehype-parse';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStripHtml from 'rehype-strip-html';
import { unified } from 'unified';

import { episodeById, podcastsByFeedId } from '@atdrago/podcast-index';
import { Artwork } from 'components/atoms/Artwork';
import { Details } from 'components/atoms/Details';
import { Head } from 'components/atoms/Head';
import { LinkStack } from 'components/atoms/LinkStack';
import { SubscribeButton } from 'components/atoms/SubscribeButton';
import { Typography } from 'components/atoms/Typography';
import { Stack } from 'components/layouts/Stack';
import { HtmlViewer } from 'components/molecules/HtmlViewer';
import { TimedList } from 'components/molecules/TimedList';
import { EpisodePlayButton } from 'components/organisms/EpisodePlayButton';
import { useMediaContext } from 'contexts/MediaContext';
import { useSettingsContext } from 'contexts/SettingsContext';
import { fetchPodcastEpisodeChapters } from 'rest/fetchPodcastEpisodeChapters';
import { fetchPodcastEpisodeTranscript } from 'rest/fetchPodcastEpisodeTranscript';
import { fetchPodcastIndexAuth } from 'rest/fetchPodcastIndexAuth';
import type {
  EpisodePageEpisode,
  EpisodePageGetStaticProps,
  IChapter,
  IEpisodePageProps,
  ITimedListItem,
  TranscriptDocument,
} from 'types';
import { longDateTimeFormat } from 'utils/date';
import { getPodcastIndexConfig } from 'utils/getPodcastIndexConfig';
import { getEpisodePath } from 'utils/paths';
import { toTitleCase } from 'utils/toTitleCase';

export const getStaticProps: EpisodePageGetStaticProps = async ({ params }) => {
  const feedId = typeof params?.feedId === 'string' ? params.feedId : null;
  const episodeId =
    typeof params?.episodeId === 'string' ? params.episodeId : null;

  if (!feedId || !episodeId) {
    return { notFound: true };
  }

  const [authTime, authToken] = await fetchPodcastIndexAuth();
  const config = getPodcastIndexConfig(authTime, authToken);

  const { episode } = (await episodeById(episodeId, config)) as {
    episode: EpisodePageEpisode;
  };
  const { feed } = await podcastsByFeedId(feedId, config);

  const episodeImageDimensions = {
    height: 512,
    width: 512,
  };

  try {
    const { height, width } = await probeImageSize(
      episode.image || episode.feedImage
    );

    // If the image is a square, keep the dimensions at 512x512
    if (height !== width) {
      episodeImageDimensions.height = height;
      episodeImageDimensions.width = width;
    }
  } catch (err) {
    // Failing to get image dimensions. This is fine, so do nothing.
  }

  // Setup person proxy image paths and sorting on the server
  if (episode.persons && episode.persons.length > 0) {
    episode.persons = episode.persons
      .map((person) => {
        /**
         * If `role` is missing, "host" should be assumed, and if `group` is
         * missing, "cast" shouold be assumed
         * @see https://github.com/Podcastindex-org/podcast-namespace/blob/main/docs/1.0.md#person
         */
        const nextPerson = {
          ...person,
          group: toTitleCase(person.group || 'cast'),
          role: toTitleCase(person.role || 'host'),
        };

        if (person.img) {
          const proxyPersonImage = new URL(
            '/api/images/proxy',
            process.env.NEXT_PUBLIC_BASE_URL
          );

          proxyPersonImage.searchParams.set('url', person.img ?? '');

          nextPerson.img = proxyPersonImage.toString();
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

  if (episode.description) {
    const descriptionRawFile = await unified()
      .use(rehypeParse)
      .use(rehypeStripHtml)
      .process(episode.description);

    if (descriptionRawFile) {
      episode.descriptionRaw = String(descriptionRawFile).replace(/\s+/g, ' ');
    }

    episode.description = ReactDomServer.renderToStaticMarkup(
      <HtmlViewer
        shouldUseCapsize={false}
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
      >
        {episode.description}
      </HtmlViewer>
    );
  }

  return {
    props: {
      episode,
      episodeImageDimensions,
      feedLink: feed.link,
      feedType: feed.type === 0 ? 'rss' : 'atom',
      feedUrl: feed.url,
    },
    // 12 hours, in seconds
    revalidate: 3600 * 12,
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    fallback: true,
    paths: [],
  };
};

const EpisodePage: NextPage<IEpisodePageProps> = ({
  episode,
  episodeImageDimensions,
  feedLink,
  feedType,
  feedUrl,
}) => {
  const { episodeSettings } = useSettingsContext();
  const [episodeCurrentTime, setEpisodeCurrentTime] = useState(
    episode ? episodeSettings[episode.id]?.currentTime ?? 0 : 0
  );
  const {
    episodeId,
    mediaPlayerCurrentTime,
    mediaPlayerCurrentTimeDebounced,
    setCurrentTime,
  } = useMediaContext();

  const isVideo = episode?.enclosureType.includes('video');
  const isThisEpisodeInThePlayer = episodeId === episode?.id;

  const interprettedCurrentTime = isThisEpisodeInThePlayer
    ? mediaPlayerCurrentTime
    : episodeCurrentTime;

  const hasTranscripts =
    episode && episode.transcripts && episode.transcripts.length > 0;

  const {
    data: transcript,
    error: transcriptsError,
    isLoading: isTranscriptLoading,
  } = useQuery<TranscriptDocument, Error>(
    ['transcript', episode?.transcripts?.length, episode?.dateCrawled],
    async () =>
      await fetchPodcastEpisodeTranscript(episode?.transcripts ?? null),
    {
      enabled: !!(hasTranscripts && typeof episode.dateCrawled === 'number'),
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    }
  );

  const {
    data: chapters,
    error: chaptersError,
    isLoading: isChaptersLoading,
  } = useQuery<Array<IChapter>, Error>(
    ['chapters', episode?.chaptersUrl, episode?.dateCrawled],
    async () => await fetchPodcastEpisodeChapters(episode?.chaptersUrl),
    {
      enabled: !!(
        episode &&
        typeof episode.dateCrawled === 'number' &&
        typeof episode.chaptersUrl === 'string' &&
        episode.chaptersUrl.length > 0
      ),
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    }
  );

  const hasChaptersUrl = !!(episode && episode?.chaptersUrl);
  const hasChapters = chapters && chapters.length > 0;
  const currentChapterIndex = hasChapters
    ? chapters.findIndex(({ startTime: chapterStartTime }) => {
        return interprettedCurrentTime < (chapterStartTime ?? 0);
      }) - 1
    : -1;
  const currentChapter =
    hasChapters && currentChapterIndex >= 0
      ? chapters[currentChapterIndex]
      : null;

  const episodeArtwork =
    currentChapter?.img || episode?.image || episode?.feedImage;

  let artworkProxyImage = null;

  if (episodeArtwork) {
    artworkProxyImage = new URL(
      '/api/images/proxy',
      process.env.NEXT_PUBLIC_BASE_URL
    );

    artworkProxyImage.searchParams.set('url', episodeArtwork);
  }

  const currentTranscriptIndex =
    transcript && transcript.length > 0
      ? transcript.findIndex(({ endTimeSeconds = 0 }) => {
          // Restrictig this check also by startTimeSeconds in the future might
          // be good, but we need to handle moments where there is no speaking,
          // and currentTranscriptIndex is `-1`
          const isCurrentTranscriptItem =
            interprettedCurrentTime < endTimeSeconds;

          return isCurrentTranscriptItem;
        })
      : -1;

  const handleTimedListItemClick = (item: ITimedListItem) => {
    if (item.startTimeSeconds) {
      if (isThisEpisodeInThePlayer) {
        setCurrentTime(item.startTimeSeconds);
      } else {
        setEpisodeCurrentTime(item.startTimeSeconds);
      }
    }
  };

  useEffect(() => {
    if (isThisEpisodeInThePlayer) {
      setEpisodeCurrentTime(mediaPlayerCurrentTimeDebounced);
    }
  }, [mediaPlayerCurrentTimeDebounced, isThisEpisodeInThePlayer]);

  return (
    <>
      {episode && (
        <Head
          titles={[episode.title, episode.feedTitle]}
          description={episode.descriptionRaw || episode.description}
          ogMetadata={{
            audio: isVideo ? undefined : episode.enclosureUrl,
            description: episode.descriptionRaw,
            image: episodeArtwork ?? '',
            title: episode.title,
            type: 'website',
            url: getEpisodePath({
              episodeId: episode.id,
              feedId: episode.feedId,
            }),
            video: isVideo ? episode.enclosureUrl : undefined,
          }}
        />
      )}
      <Stack as="main" maxWidth="small">
        <Artwork
          alt="Podcast episode or chapter artwork"
          height={episodeImageDimensions?.height}
          priority={true}
          shadow="medium"
          isSquare={episodeImageDimensions && !!hasChapters}
          src={artworkProxyImage?.toString()}
          width={episodeImageDimensions?.width}
        />
        <EpisodePlayButton
          currentChapter={currentChapter}
          episode={episode}
          episodeCurrentTime={episodeCurrentTime}
          episodeImageDimensions={episodeImageDimensions}
          isVideo={isVideo}
        />
        <Stack space="large">
          {episode && episode.persons && episode.persons.length ? (
            <Details
              summary={
                <Typography as="h4" size="headingSmaller">
                  People
                </Typography>
              }
            >
              <Stack space="small">
                {episode.persons.map((person, index) => {
                  return (
                    <LinkStack
                      align="center"
                      space="small"
                      kind="flexRow"
                      key={index}
                      {...(person.href
                        ? {
                            anchorProps: {
                              rel: 'noreferrer noopener',
                              target: '_blank',
                            },
                            href: person.href,
                          }
                        : undefined)}
                    >
                      <Artwork
                        alt={person.name}
                        label={`${index + 1}.`}
                        src={person.img}
                        width={80}
                        height={80}
                        shadow="medium"
                      />
                      <Stack
                        space="small"
                        style={{
                          flex: '0 1 auto',
                          overflow: 'hidden',
                          padding: '4px 0',
                        }}
                      >
                        <Typography as="h5" size="paragraph">
                          {person.name}
                        </Typography>
                        {person.role && (
                          <Typography as="p" size="paragraph">
                            {person.role}
                          </Typography>
                        )}
                        {person.href && (
                          <Typography as="p" size="legal" whitespace="ellipsis">
                            {person.href}
                          </Typography>
                        )}
                      </Stack>
                    </LinkStack>
                  );
                })}
              </Stack>
            </Details>
          ) : null}
          {hasTranscripts && (
            <TimedList
              error={transcriptsError}
              hasError={!!transcriptsError}
              index={currentTranscriptIndex}
              isLoading={isTranscriptLoading}
              list={transcript ?? []}
              title="Transcript"
              onItemClick={handleTimedListItemClick}
            />
          )}
          {hasChaptersUrl && (
            <TimedList
              error={chaptersError}
              hasError={!!chaptersError}
              index={currentChapterIndex}
              isLoading={isChaptersLoading}
              list={
                hasChapters
                  ? chapters.map(({ startTime: chapterStartTime, title }) => ({
                      startTimeSeconds: chapterStartTime ?? undefined,
                      text: title ?? 'No title',
                    }))
                  : []
              }
              title="Chapters"
              onItemClick={handleTimedListItemClick}
            />
          )}
          <Details
            summary={
              <Typography as="h4" size="headingSmaller">
                Description
              </Typography>
            }
          >
            <span
              dangerouslySetInnerHTML={{ __html: episode?.description ?? '' }}
            />
          </Details>
        </Stack>
        <Typography as="p" size="paragraph">
          Published:{' '}
          {episode
            ? longDateTimeFormat.format(new Date(episode.datePublished * 1000))
            : null}
        </Typography>
        {episode && feedType && feedLink && feedUrl && (
          <SubscribeButton
            feedId={episode.feedId}
            feedType={feedType}
            htmlUrl={feedLink}
            image={episode.feedImage}
            title={episode.feedTitle}
            xmlUrl={feedUrl}
          />
        )}
      </Stack>
    </>
  );
};

export default EpisodePage;
