import type { GetStaticPaths, NextPage } from 'next';
import Head from 'next/head';
import { useState } from 'react';
import { useQuery } from 'react-query';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';

import { Artwork } from 'components/atoms/Artwork';
import { Details } from 'components/atoms/Details';
import { IconButton } from 'components/atoms/IconButton';
import { LinkStack } from 'components/atoms/LinkStack';
import { PlayPauseIcon } from 'components/atoms/PlayPauseIcon';
import { SubscribeButton } from 'components/atoms/SubscribeButton';
import { Typography } from 'components/atoms/Typography';
import { Stack } from 'components/layouts/Stack';
import { Header } from 'components/molecules/Header';
import { HtmlViewer } from 'components/molecules/HtmlViewer';
import { TimedList } from 'components/molecules/TimedList';
import { audioContextDefaults, useAudioContext } from 'contexts/AudioContext';
import { useSettingsContext } from 'contexts/SettingsContext';
import { fetchPodcastEpisodeChapters } from 'rest/fetchPodcastEpisodeChapters';
import { fetchPodcastEpisodeTranscript } from 'rest/fetchPodcastEpisodeTranscript';
import { fetchPodcastIndexAuth } from 'rest/fetchPodcastIndexAuth';
import type {
  EpisodePageGetStaticProps,
  IEpisodePageProps,
  ITimedListItem,
} from 'types';
import { noteDateTimeFormat } from 'utils/date';
import { getPodcastIndexConfig } from 'utils/getPodcastIndexConfig';
import { episodeById } from 'utils/podcastIndex';
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

  const { episode } = await episodeById(episodeId, config);

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

  return {
    props: {
      episode,
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

const EpisodePage: NextPage<IEpisodePageProps> = ({ episode }) => {
  const { episodeSettings } = useSettingsContext();
  const [episodeCurrentTime, setEpisodeCurrentTime] = useState(
    episodeSettings[episode.id]?.currentTime ?? 0
  );

  const {
    audioPlayerCurrentTime,
    audioRef,
    episodeId,
    isPaused,
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
    setSrc,
    src,
  } = useAudioContext() || audioContextDefaults;

  const isThisEpisodeInThePlayer = episodeId === episode.id;
  const isThisEpisodePaused = isPaused || !isThisEpisodeInThePlayer;

  const interprettedCurrentTime = isThisEpisodeInThePlayer
    ? audioPlayerCurrentTime
    : episodeCurrentTime;

  const { data: transcript } = useQuery(
    ['transcript', episode.transcripts?.length, episode.dateCrawled],
    async () => await fetchPodcastEpisodeTranscript(episode.transcripts),
    {
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    }
  );

  const { data: chapters } = useQuery(
    ['chapters', episode.chaptersUrl, episode.dateCrawled],
    async () => await fetchPodcastEpisodeChapters(episode.chaptersUrl),
    {
      enabled:
        typeof episode.dateCrawled === 'number' &&
        typeof episode.chaptersUrl === 'string' &&
        episode.chaptersUrl.length > 0,
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
    currentChapter?.img || episode.image || episode.feedImage;

  const artworkProxyImage = new URL(
    '/api/images/proxy',
    process.env.NEXT_PUBLIC_BASE_URL
  );

  artworkProxyImage.searchParams.set('url', episodeArtwork);

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

  return (
    <>
      <Head>
        <title>
          {episode.title} - {episode.feedTitle} - podcast.fish
        </title>
        <meta name="description" content={episode.description} />
      </Head>

      <Stack as="main" maxWidth="small">
        <Stack as="article">
          <Header feedTitle={episode.feedTitle} feedId={episode.feedId} />
          {episodeArtwork && (
            <Artwork
              alt="Podcast episode or chapter artwork"
              edge="overflow"
              priority={true}
              shadow="medium"
              src={artworkProxyImage.toString()}
            />
          )}
          <Stack
            as="label"
            kind="flexRow"
            space="small"
            align="center"
            justify="center"
            style={{ width: 'auto' }}
          >
            <IconButton
              background="circle"
              label={isThisEpisodePaused ? 'Play podcast' : 'Pause podcast'}
              onClick={async () => {
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
                }

                setIsPaused(nextIsPaused);

                if (audioRef.current) {
                  if (nextIsPaused) {
                    audioRef.current.pause();
                  } else {
                    await audioRef.current?.play();
                  }
                }
              }}
              size="medium"
            >
              <PlayPauseIcon size="medium" isPaused={isThisEpisodePaused} />
            </IconButton>
            <Typography size="headingSmaller" as="h3" whitespace={2}>
              {episode.title}
            </Typography>
          </Stack>

          <Stack space="large">
            {episode.persons && episode.persons.length ? (
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
                        anchorProps={{
                          rel: 'noreferrer noopener',
                          target: '_blank',
                        }}
                        href={person.href}
                        align="center"
                        space="small"
                        kind="flexRow"
                        key={index}
                      >
                        <Artwork
                          alt={person.name}
                          src={person.img}
                          width={100}
                          height={100}
                        />
                        <Stack space="small">
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
                list={chapters.map(
                  ({ startTime: chapterStartTime, title }) => ({
                    startTimeSeconds: chapterStartTime ?? undefined,
                    text: title ?? 'No title',
                  })
                )}
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
              <HtmlViewer
                shouldUseCapsize={false}
                rehypePlugins={[rehypeRaw, rehypeSanitize]}
              >
                {episode.description}
              </HtmlViewer>
            </Details>
          </Stack>
          <Typography as="p" size="paragraph">
            Published:{' '}
            {noteDateTimeFormat.format(new Date(episode.datePublished * 1000))}
          </Typography>
          <SubscribeButton
            feedId={episode.feedId}
            image={episode.feedImage}
            title={episode.feedTitle}
          />
        </Stack>
      </Stack>
    </>
  );
};

export default EpisodePage;
