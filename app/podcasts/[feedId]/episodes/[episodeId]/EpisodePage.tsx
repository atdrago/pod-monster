'use client';

import { useQuery } from '@tanstack/react-query';
import type { ApiResponse, PIApiPodcast } from 'podcastdx-client/src/types';
import { useEffect, useMemo, useState } from 'react';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';

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
import { TimedList } from 'components/molecules/TimedList';
import { EpisodePlayButton } from 'components/organisms/EpisodePlayButton';
import { useMediaContext } from 'contexts/MediaContext';
import { useSettingsContext } from 'contexts/SettingsContext';
import { useChapterIndex } from 'hooks/useChapterIndex';
import ExternalLinkIcon from 'icons/arrow-up-right2.svg';
import TvIcon from 'icons/tv.svg';
import { fetchPodcastEpisodeChapters } from 'rest/fetchPodcastEpisodeChapters';
import { fetchPodcastEpisodeTranscript } from 'rest/fetchPodcastEpisodeTranscript';
import type {
  IChapter,
  IImageDimensions,
  ITimedListItem,
  TranscriptDocument,
} from 'types';
import { longDateTimeFormat } from 'utils/date';
import { notNullOrUndefined } from 'utils/notNullOrUndefined';

export interface IEpisodePageProps {
  episode: ApiResponse.EpisodeById['episode'];
  episodeImageDimensions?: IImageDimensions;
  feedFunding?: PIApiPodcast['funding'] | null;
  feedLink?: string;
  feedType?: 'rss' | 'atom';
  feedUrl?: string;
}

export const EpisodePage = ({
  episode,
  episodeImageDimensions,
  feedFunding,
  feedLink,
  feedType,
  feedUrl,
}: IEpisodePageProps) => {
  const { episodeSettings } = useSettingsContext();
  const [episodeCurrentTime, setEpisodeCurrentTime] = useState(
    episode ? episodeSettings[episode.id]?.currentTime ?? 0 : 0
  );
  const episodeDuration =
    episode?.duration ||
    (episode && episodeSettings[episode.id]?.duration) ||
    0;
  const {
    episodeId,
    isTranscriptVisibleAsSubtitle,
    mediaPlayerCurrentTime,
    mediaPlayerCurrentTimeDebounced,
    setCurrentTime,
    setIsTranscriptVisibleAsSubtitle,
  } = useMediaContext();

  const isVideo = episode?.enclosureType.includes('video');
  const isThisEpisodeInThePlayer = episodeId === episode?.id;

  const interpretedCurrentTime = isThisEpisodeInThePlayer
    ? mediaPlayerCurrentTime
    : episodeCurrentTime;

  const hasTranscripts =
    episode && episode.transcripts && episode.transcripts.length > 0;

  const {
    data: transcript,
    error: transcriptsError,
    isLoading: isTranscriptLoading,
  } = useQuery<TranscriptDocument, Error>({
    enabled: !!(hasTranscripts && typeof episode.dateCrawled === 'number'),
    queryFn: async () =>
      await fetchPodcastEpisodeTranscript(
        episode?.transcripts ?? null,
        episodeDuration
      ),
    queryKey: [
      'transcript',
      episode?.transcripts?.length,
      episode?.dateCrawled,
      episodeDuration,
    ],
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  const {
    data: chapters = [],
    error: chaptersError,
    isLoading: isChaptersLoading,
  } = useQuery<Array<IChapter>, Error>({
    enabled: !!(
      episode &&
      typeof episode.dateCrawled === 'number' &&
      typeof episode.chaptersUrl === 'string' &&
      episode.chaptersUrl.length > 0
    ),
    queryFn: async () =>
      await fetchPodcastEpisodeChapters(episode?.chaptersUrl),
    queryKey: ['chapters', episode?.chaptersUrl, episode?.dateCrawled],
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  const hasChaptersUrl = !!(episode && episode?.chaptersUrl);
  const hasChapters = chapters.length > 0;
  const nonTocChapters = useMemo(
    () => chapters.filter(({ toc }) => toc !== false),
    [chapters]
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

  const chaptersAsTimedList = nonTocChapters?.map(
    ({ startTime: chapterStartTime, title }) => ({
      from: chapterStartTime,
      text: title ?? 'No title',
    })
  );

  const episodeArtwork =
    currentChapter?.img || episode?.image || episode?.feedImage;

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

  const handleTimedListItemClick = (item: ITimedListItem) => {
    if (item.from) {
      if (isThisEpisodeInThePlayer) {
        setCurrentTime(item.from);
      } else {
        setEpisodeCurrentTime(item.from);
      }
    }
  };

  useEffect(() => {
    if (isThisEpisodeInThePlayer) {
      setEpisodeCurrentTime(mediaPlayerCurrentTimeDebounced);
    }
  }, [mediaPlayerCurrentTimeDebounced, isThisEpisodeInThePlayer]);

  const currentTranscriptItem = transcript?.content[currentTranscriptIndex];
  const currentTranscriptItemText =
    currentTranscriptItem && isTranscriptVisibleAsSubtitle
      ? typeof currentTranscriptItem === 'string'
        ? currentTranscriptItem
        : currentTranscriptItem.text
      : null;

  return (
    <>
      <Header
        episodeId={episode.id}
        feedId={episode.feedId}
        episodeTitle={episode.title}
        feedTitle={episode.feedTitle}
      />
      <Stack as="main" maxWidth="small">
        <Artwork
          alt="Podcast episode or chapter artwork"
          height={episodeImageDimensions?.height}
          priority={true}
          shadow="medium"
          isSquare={episodeImageDimensions && !!hasChapters}
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
          {episode && (episode.season || episode.episode) ? (
            <Stack kind="flexRow" space="small">
              <Icon as={TvIcon} size="xsmall" />
              <Typography as="h4" size="headingSmaller">
                {[
                  episode.season ? `Season ${episode.season}` : null,
                  episode.episode ? `Episode ${episode.episode}` : null,
                ]
                  .filter(notNullOrUndefined)
                  .join(', ')}
              </Typography>
            </Stack>
          ) : null}
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
          {hasChaptersUrl && (
            <TimedList
              error={chaptersError}
              hasError={!!chaptersError}
              index={currentNonTocChapterIndex}
              isLoading={isChaptersLoading}
              list={chaptersAsTimedList ?? []}
              title="Chapters"
              onItemClick={handleTimedListItemClick}
            />
          )}
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
                            href: person.href,
                            rel: 'noreferrer noopener',
                            target: '_blank',
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
                        space="xsmall"
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
            transcript && Array.isArray(transcript?.content) ? (
              <TimedList
                index={currentTranscriptIndex}
                list={transcript.content ?? []}
                title="Transcript"
                onItemClick={handleTimedListItemClick}
                isVisibleAsSubtitle={isTranscriptVisibleAsSubtitle}
                onIsVisibleAsSubtitleChange={setIsTranscriptVisibleAsSubtitle}
              />
            ) : (
              <Details
                hasError={!!transcriptsError}
                isLoading={isTranscriptLoading}
                summary={
                  <Typography as="h4" size="headingSmaller">
                    Transcript
                  </Typography>
                }
              >
                <Typography
                  as="p"
                  size="paragraph"
                  style={{
                    height: transcriptsError ? 'auto' : 48 * 5,
                    overflowY: 'auto',
                    padding: '4px 0',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {transcriptsError ? (
                    transcriptsError.message
                  ) : typeof transcript?.content === 'string' ? (
                    <span
                      dangerouslySetInnerHTML={{
                        __html: transcript?.content,
                      }}
                    ></span>
                  ) : (
                    'Transcript type not supported'
                  )}
                </Typography>
              </Details>
            )
          ) : null}

          <Funding funding={feedFunding} />

          <Typography as="p" size="paragraph">
            {episode
              ? `Published on ${longDateTimeFormat.format(
                  new Date(episode.datePublished * 1000)
                )}.`
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
      </Stack>
    </>
  );
};
