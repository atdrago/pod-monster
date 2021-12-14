import type { GetStaticPaths, NextPage } from 'next';
import { useEffect, useState } from 'react';
import ReactDomServer from 'react-dom/server';
import { useQuery } from 'react-query';
import rehypeParse from 'rehype-parse';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStripHtml from 'rehype-strip-html';
import { unified } from 'unified';

import { Artwork } from 'components/atoms/Artwork';
import { Details } from 'components/atoms/Details';
import { Head } from 'components/atoms/Head';
import { IconButton } from 'components/atoms/IconButton';
import { LinkStack } from 'components/atoms/LinkStack';
import { PlayPauseIcon } from 'components/atoms/PlayPauseIcon';
import { SubscribeButton } from 'components/atoms/SubscribeButton';
import { Typography } from 'components/atoms/Typography';
import { Stack } from 'components/layouts/Stack';
import { HtmlViewer } from 'components/molecules/HtmlViewer';
import { TimedList } from 'components/molecules/TimedList';
import { mediaContextDefaults, useMediaContext } from 'contexts/MediaContext';
import { useSettingsContext } from 'contexts/SettingsContext';
import { fetchPodcastEpisodeChapters } from 'rest/fetchPodcastEpisodeChapters';
import { fetchPodcastEpisodeTranscript } from 'rest/fetchPodcastEpisodeTranscript';
import { fetchPodcastIndexAuth } from 'rest/fetchPodcastIndexAuth';
import type {
  EpisodePageEpisode,
  EpisodePageGetStaticProps,
  IEpisodePageProps,
  ITimedListItem,
} from 'types';
import { noteDateTimeFormat } from 'utils/date';
import { getPodcastIndexConfig } from 'utils/getPodcastIndexConfig';
import { episodeById, podcastsByFeedId } from 'utils/podcastIndex';
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
  feedLink,
  feedType,
  feedUrl,
}) => {
  const { episodeSettings } = useSettingsContext();
  const [episodeCurrentTime, setEpisodeCurrentTime] = useState(
    episode ? episodeSettings[episode.id]?.currentTime ?? 0 : 0
  );
  const {
    audioRef,
    episodeId,
    isPaused,
    mediaPlayerCurrentTime,
    mediaPlayerCurrentTimeDebounced,
    setChaptersUrl,
    setCurrentTime,
    setDateCrawled,
    setEpisodeId,
    setEpisodeImage,
    setEpisodeTitle,
    setFeedId,
    setFeedImage,
    setFeedTitle,
    setIsPaused,
    setSize,
    setSrc,
    setSrcType,
    src,
    videoRef,
  } = useMediaContext() || mediaContextDefaults;

  const isVideo = episode?.enclosureType.includes('video');
  const isThisEpisodeInThePlayer = episodeId === episode?.id;
  const isThisEpisodePaused = isPaused || !isThisEpisodeInThePlayer;

  const interprettedCurrentTime = isThisEpisodeInThePlayer
    ? mediaPlayerCurrentTime
    : episodeCurrentTime;

  const { data: transcript } = useQuery(
    ['transcript', episode?.transcripts?.length, episode?.dateCrawled],
    async () =>
      await fetchPodcastEpisodeTranscript(episode?.transcripts ?? null),
    {
      enabled: !!(
        episode &&
        typeof episode.dateCrawled === 'number' &&
        episode.transcripts &&
        episode.transcripts.length > 0
      ),
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    }
  );

  const { data: chapters } = useQuery(
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
    currentChapter?.img ||
    // This isn't a great assumption, but this sort of aligns with what TWiT
    // does. If it's a video, the `image` is the same dimensions as the video,
    // so it should presumably be used as the poster frame.
    (isVideo ? episode?.feedImage : episode?.image || episode?.feedImage);

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

  const handlePlayPauseClick = async () => {
    if (!episode) {
      return;
    }

    const nextIsPaused = !isThisEpisodePaused;

    if (!nextIsPaused && episode.enclosureUrl !== src) {
      setChaptersUrl(episode.chaptersUrl);
      setCurrentTime(episodeCurrentTime);
      setDateCrawled(episode.dateCrawled);
      setEpisodeId(episode.id);
      setEpisodeImage(episode.image);
      setEpisodeTitle(episode.title);
      setFeedId(episode.feedId);
      setFeedImage(episode.feedImage);
      setFeedTitle(episode.feedTitle);
      setSrc(episode.enclosureUrl);
      setSrcType(episode.enclosureType);
      setSize(isVideo ? 2 : 1);
    }

    setIsPaused(nextIsPaused);

    if (audioRef.current) {
      if (nextIsPaused) {
        audioRef.current.pause();
      } else {
        await audioRef.current?.play();
      }
    }

    if (videoRef.current) {
      if (nextIsPaused) {
        videoRef.current.pause();
      } else {
        await videoRef.current?.play();
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
        />
      )}
      <Stack as="main" maxWidth="small">
        <Artwork
          alt="Podcast episode or chapter artwork"
          edge="overflow"
          priority={true}
          shadow="medium"
          src={artworkProxyImage?.toString()}
        />
        <Stack
          aria-label={isThisEpisodePaused ? 'Play podcast' : 'Pause podcast'}
          as="button"
          kind="flexRow"
          space="small"
          align="center"
          justify="center"
          style={{
            cursor: 'pointer',
            width: 'auto',
          }}
          onClick={handlePlayPauseClick}
          type="button"
        >
          <IconButton as="span" background="circle" size="medium">
            <PlayPauseIcon size="medium" isPaused={isThisEpisodePaused} />
          </IconButton>
          <Typography size="headingSmaller" as="h3" whitespace={2}>
            {episode?.title}
          </Typography>
        </Stack>

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
                      <Stack space="small" style={{ flex: '0 1 auto' }}>
                        <Typography as="h5" size="paragraph">
                          {person.name}
                        </Typography>
                        {person.role && (
                          <Typography as="p" size="paragraph">
                            {person.role}
                          </Typography>
                        )}
                        {person.href && (
                          <Typography as="p" size="legal">
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
          {transcript && (
            <TimedList
              index={currentTranscriptIndex}
              list={transcript}
              title="Transcript"
              onItemClick={handleTimedListItemClick}
            />
          )}
          {chapters && (
            <TimedList
              index={currentChapterIndex}
              list={chapters.map(({ startTime: chapterStartTime, title }) => ({
                startTimeSeconds: chapterStartTime ?? undefined,
                text: title ?? 'No title',
              }))}
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
            ? noteDateTimeFormat.format(new Date(episode.datePublished * 1000))
            : null}
        </Typography>
        {episode && (
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
