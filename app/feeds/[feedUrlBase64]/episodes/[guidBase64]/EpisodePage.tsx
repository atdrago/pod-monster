'use client';

import { skipToken, useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, {
  defaultSchema,
  type Options as SanitizeSchema,
} from 'rehype-sanitize';
import type { PluggableList } from 'unified';

import { Artwork } from 'components/atoms/Artwork';
import { Details } from 'components/atoms/Details';
import { Icon } from 'components/atoms/Icon';
import { LinkStack } from 'components/atoms/LinkStack';
import { SubscribeButton } from 'components/atoms/SubscribeButton';
import { Typography } from 'components/atoms/Typography';
import { Stack } from 'components/layouts/Stack';
import { Funding } from 'components/molecules/Funding';
import { Header } from 'components/molecules/Header';
import { HtmlViewer } from 'components/molecules/HtmlViewer';
import { TimedList, type TimedListItem } from 'components/molecules/TimedList';
import { EpisodePlayButton } from 'components/organisms/EpisodePlayButton';
import { useMediaContext } from 'contexts/MediaContext';
import { useSettingsContext } from 'contexts/SettingsContext';
import { useChapterIndex } from 'hooks/useChapterIndex';
import ExternalLinkIcon from 'icons/arrow-up-right2.svg';
import TvIcon from 'icons/tv.svg';
import VideoCameraIcon from 'icons/video-camera.svg';
import { fetchPodcastEpisodeChapters } from 'rest/fetchPodcastEpisodeChapters';
import {
  fetchPodcastEpisodeTranscript,
  getPreferredTranscript,
  type TranscriptDocument,
} from 'rest/fetchPodcastEpisodeTranscript';
import type { Chapter, ImageDimensions } from 'types';
import type { PodcastEpisode, PodcastFeed } from 'types/PodcastFeed';
import { longDateTimeFormat } from 'utils/date';
import { notNullOrUndefined } from 'utils/notNullOrUndefined';
import { toTitleCase } from 'utils/toTitleCase';

interface EpisodePageProps {
  episode: PodcastEpisode;
  episodeImageDimensions?: ImageDimensions;
  feed: PodcastFeed;
  /** The raw `t` value of the URL, when the URL has one. */
  // TODO: Ask to play from `t` when `t` is valid for the episode.
  t?: string;
}

/**
 * Feed HTML can hold a script, an event handler, or a `javascript:` link. The
 * sanitize step runs after `rehypeRaw`, so that it also cleans the HTML that
 * `rehypeRaw` parses. The schema removes the `rel` of the feed, and then adds
 * this `rel` to each link.
 */
const FEED_HTML_SANITIZE_SCHEMA: SanitizeSchema = {
  ...defaultSchema,
  required: {
    ...defaultSchema.required,
    a: { rel: ['nofollow', 'ugc', 'noopener', 'noreferrer'] },
  },
};

const FEED_HTML_REHYPE_PLUGINS: PluggableList = [
  rehypeRaw,
  [rehypeSanitize, FEED_HTML_SANITIZE_SCHEMA],
];

/**
 * A person with no role is a host.
 * @see https://github.com/Podcastindex-org/podcast-namespace/blob/main/docs/1.0.md#person
 */
const toDisplayPersons = (persons: PodcastEpisode['persons'] = []) =>
  persons
    .map((person) => ({ ...person, role: toTitleCase(person.role ?? 'host') }))
    .sort((personA, personB) => {
      if (personA.role === personB.role) {
        return personA.name < personB.name ? -1 : 1;
      }

      return personA.role === 'Host' ? -1 : 1;
    });

export const EpisodePage = ({
  episode,
  episodeImageDimensions,
  feed,
}: EpisodePageProps) => {
  const { getEpisodeSettingsItem } = useSettingsContext();
  const episodeSettingsItem = getEpisodeSettingsItem({
    episodeIdentity: episode.identity,
    feedUrl: episode.feedUrl,
  });
  const [episodeCurrentTime, setEpisodeCurrentTime] = useState(
    episodeSettingsItem?.currentTime ?? 0,
  );
  const episodeDuration =
    episode.duration || episodeSettingsItem?.duration || 0;
  const {
    episodeIdentity,
    feedUrl,
    isTranscriptVisibleAsSubtitle,
    mediaPlayerCurrentTimeDebounced,
    setCurrentTime,
    setIsTranscriptVisibleAsSubtitle,
  } = useMediaContext();

  const isVideo = episode.enclosureType?.includes('video') ?? false;
  const isThisEpisodeInThePlayer =
    episodeIdentity === episode.identity && feedUrl === episode.feedUrl;

  // Derive the current time based on whether this episode is in the player
  // If it's in the player, use the debounced media player time; otherwise use local state
  const interpretedCurrentTime = isThisEpisodeInThePlayer
    ? mediaPlayerCurrentTimeDebounced
    : episodeCurrentTime;

  const hasTranscripts =
    episode.transcripts !== undefined && episode.transcripts.length > 0;
  const preferredTranscript = getPreferredTranscript(episode.transcripts);
  const isTranscriptTypeUnsupported =
    hasTranscripts && preferredTranscript === undefined;

  // The key holds the URL of the transcript, so that two episodes with the
  // same transcript count and duration do not share a cache entry.
  const {
    data: transcript,
    error: transcriptsError,
    isLoading: isTranscriptLoading,
  } = useQuery<TranscriptDocument, Error>({
    queryFn:
      preferredTranscript === undefined
        ? skipToken
        : async () =>
            await fetchPodcastEpisodeTranscript(
              preferredTranscript,
              episodeDuration,
            ),
    queryKey: [
      'transcript',
      preferredTranscript?.url,
      preferredTranscript?.type,
      episodeDuration,
    ],
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  // `MediaContext` uses the same key and function, so the page and the player
  // share one cache entry.
  const { chaptersUrl } = episode;
  const {
    data: chapters = [],
    error: chaptersError,
    isLoading: isChaptersLoading,
  } = useQuery<Array<Chapter>, Error>({
    queryFn:
      chaptersUrl === undefined
        ? skipToken
        : async () => await fetchPodcastEpisodeChapters(chaptersUrl),
    queryKey: ['chapters', chaptersUrl],
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  const persons = useMemo(
    () => toDisplayPersons(episode.persons),
    [episode.persons],
  );

  const hasChaptersUrl = chaptersUrl !== undefined;
  const hasChapters = chapters.length > 0;
  const nonTocChapters = useMemo(
    () => chapters.filter(({ toc }) => toc !== false),
    [chapters],
  );
  const currentChapterIndex = useChapterIndex({
    chapters,
    currentTime: interpretedCurrentTime,
  });
  const currentNonTocChapterIndex = useChapterIndex({
    chapters: nonTocChapters,
    currentTime: interpretedCurrentTime,
  });

  const currentChapter =
    hasChapters && currentChapterIndex >= 0
      ? chapters[currentChapterIndex]
      : null;

  const chaptersAsTimedList = nonTocChapters.map(
    ({ startTime: chapterStartTime, title }) => ({
      from: chapterStartTime,
      text: title ?? 'No title',
    }),
  );

  const episodeArtwork =
    currentChapter?.img || episode.image || episode.feedImage;

  const currentTranscriptIndex =
    transcript &&
    Array.isArray(transcript.content) &&
    transcript.content.length > 0
      ? transcript.content.findIndex(({ to = 0 }) => {
          // Restricting this check also by startTimeSeconds in the future might
          // be good, but we need to handle moments where there is no speaking,
          // and currentTranscriptIndex is `-1`
          const isCurrentTranscriptItem = interpretedCurrentTime < to;

          return isCurrentTranscriptItem;
        })
      : -1;

  const handleTimedListItemClick = (item: TimedListItem) => {
    if (typeof item.from === 'number') {
      if (isThisEpisodeInThePlayer) {
        setCurrentTime(item.from);
      } else {
        setEpisodeCurrentTime(item.from);
      }
    }
  };

  const currentTranscriptItem = transcript?.content[currentTranscriptIndex];
  const currentTranscriptItemText =
    currentTranscriptItem && isTranscriptVisibleAsSubtitle
      ? typeof currentTranscriptItem === 'string'
        ? currentTranscriptItem
        : currentTranscriptItem.text
      : null;

  return (
    <>
      <Header episode={episode} />
      <Stack as="main" maxWidth="small">
        <Artwork
          alt="Podcast episode or chapter artwork"
          height={episodeImageDimensions?.height}
          isSquare={episodeImageDimensions && !!hasChapters}
          shadow={true}
          src={episodeArtwork}
          subtitle={currentTranscriptItemText}
          width={episodeImageDimensions?.width}
        />
        <EpisodePlayButton
          currentChapter={currentChapter}
          episode={episode}
          episodeCurrentTime={episodeCurrentTime}
          episodeImageDimensions={episodeImageDimensions}
          isVideo={isVideo}
        />
        <Stack space="medium">
          {episode.seasonNumber || episode.episodeNumber ? (
            <Stack kind="flexRow" space="small">
              <Icon as={TvIcon} size="xsmall" />
              <Typography as="h4" className="font-bold" size="headingSmaller">
                {[
                  episode.seasonNumber
                    ? `Season ${episode.seasonNumber}`
                    : null,
                  episode.episodeNumber
                    ? `Episode ${episode.episodeNumber}`
                    : null,
                ]
                  .filter(notNullOrUndefined)
                  .join(', ')}
              </Typography>
            </Stack>
          ) : null}
          {episode.episodeType === 'trailer' ? (
            <Stack kind="flexRow" space="small">
              <Icon as={VideoCameraIcon} size="xsmall" />
              <Typography as="h4" className="font-bold" size="headingSmaller">
                Trailer
              </Typography>
            </Stack>
          ) : null}
          {episode.description ? (
            <Details
              summary={
                <Typography as="h4" className="font-bold" size="headingSmaller">
                  Description
                </Typography>
              }
            >
              <HtmlViewer
                shouldUseCapsize={false}
                rehypePlugins={FEED_HTML_REHYPE_PLUGINS}
              >
                {episode.description}
              </HtmlViewer>
            </Details>
          ) : null}
          {hasChaptersUrl && (
            <TimedList
              error={chaptersError}
              hasError={!!chaptersError}
              index={currentNonTocChapterIndex}
              isLoading={isChaptersLoading}
              list={chaptersAsTimedList}
              title="Chapters"
              onItemClick={handleTimedListItemClick}
            />
          )}
          {persons.length > 0 ? (
            <Details
              summary={
                <Typography as="h4" className="font-bold" size="headingSmaller">
                  People
                </Typography>
              }
            >
              <Stack space="small">
                {persons.map((person, index) => {
                  return (
                    <LinkStack
                      align="center"
                      space="small"
                      kind="flexRow"
                      key={index}
                      {...(person.href
                        ? {
                            href: person.href,
                            rel: 'noreferrer noopener',
                            target: '_blank',
                          }
                        : undefined)}
                    >
                      <Artwork
                        alt={person.name}
                        height={80}
                        label={`${index + 1}.`}
                        shadow={true}
                        src={person.img}
                        width={80}
                      />
                      <Stack
                        space="xsmall"
                        style={{
                          flex: '0 1 auto',
                          overflow: 'hidden',
                          padding: '4px 0',
                        }}
                      >
                        <Typography
                          as="h5"
                          className="font-bold"
                          size="paragraph"
                        >
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
                      {person.href && (
                        <Icon as={ExternalLinkIcon} size="small" />
                      )}
                    </LinkStack>
                  );
                })}
              </Stack>
            </Details>
          ) : null}
          {hasTranscripts ? (
            transcript && Array.isArray(transcript.content) ? (
              <TimedList
                index={currentTranscriptIndex}
                list={transcript.content}
                title="Transcript"
                onItemClick={handleTimedListItemClick}
                isVisibleAsSubtitle={isTranscriptVisibleAsSubtitle}
                onIsVisibleAsSubtitleChange={setIsTranscriptVisibleAsSubtitle}
              />
            ) : (
              <Details
                hasError={!!transcriptsError || isTranscriptTypeUnsupported}
                isLoading={isTranscriptLoading}
                summary={
                  <Typography
                    as="h4"
                    className="font-bold"
                    size="headingSmaller"
                  >
                    Transcript
                  </Typography>
                }
              >
                <Typography
                  as="div"
                  size="paragraph"
                  style={{
                    height:
                      transcriptsError || isTranscriptTypeUnsupported
                        ? 'auto'
                        : 48 * 5,
                    overflowY: 'auto',
                    padding: '4px 0',
                  }}
                >
                  {transcriptsError ? (
                    transcriptsError.message
                  ) : typeof transcript?.content === 'string' ? (
                    <HtmlViewer
                      shouldUseCapsize={false}
                      rehypePlugins={FEED_HTML_REHYPE_PLUGINS}
                    >
                      {transcript.content}
                    </HtmlViewer>
                  ) : (
                    'Transcript type not supported'
                  )}
                </Typography>
              </Details>
            )
          ) : null}

          <Funding funding={feed.funding} />

          {episode.datePublished === undefined ? null : (
            <Typography as="p" size="paragraph">
              {`Published on ${longDateTimeFormat.format(
                new Date(episode.datePublished * 1000),
              )}.`}
            </Typography>
          )}
          <SubscribeButton feed={feed} />
        </Stack>
      </Stack>
    </>
  );
};
