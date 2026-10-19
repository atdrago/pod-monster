import { ExternalLink } from 'components/atoms/ExternalLink';
import { Icon } from 'components/atoms/Icon';
import { IconButton } from 'components/atoms/IconButton';
import { PlayPauseIcon } from 'components/atoms/PlayPauseIcon';
import { Typography } from 'components/atoms/Typography';
import { Stack } from 'components/layouts/Stack';
import { useMediaContext } from 'contexts/MediaContext';
import ChapterLinkIcon from 'icons/arrow-up-right2.svg';
import ExplicitIcon from 'icons/explicit.svg';
import type { Chapter, ImageDimensions } from 'types';
import type { PodcastEpisode } from 'types/PodcastFeed';

interface EpisodePlayButtonProps {
  currentChapter: Chapter | null;
  episode: Pick<
    PodcastEpisode,
    | 'chaptersUrl'
    | 'enclosureType'
    | 'enclosureUrl'
    | 'explicit'
    | 'feedImage'
    | 'feedTitle'
    | 'feedUrl'
    | 'identity'
    | 'image'
    | 'title'
  >;
  episodeCurrentTime: number;
  episodeImageDimensions?: ImageDimensions;
  isVideo?: boolean;
}

export const EpisodePlayButton = ({
  currentChapter,
  episode,
  episodeCurrentTime,
  episodeImageDimensions,
  isVideo,
}: EpisodePlayButtonProps) => {
  const {
    audioRef,
    didError,
    episodeIdentity,
    feedUrl,
    isLoadingAtCurrentTime,
    isPaused,
    setChaptersUrl,
    setCurrentTime,
    setDidError,
    setEpisodeIdentity,
    setEpisodeImage,
    setEpisodeImageDimensions,
    setEpisodeTitle,
    setFeedImage,
    setFeedTitle,
    setFeedUrl,
    setIsPaused,
    setSize,
    setSrc,
    setSrcType,
    src,
    videoRef,
  } = useMediaContext();

  const { enclosureUrl } = episode;
  const isThisEpisodeInThePlayer =
    episodeIdentity === episode.identity && feedUrl === episode.feedUrl;
  const isThisEpisodePaused = isPaused || !isThisEpisodeInThePlayer;
  const isThisEpisodeLoadingAtCurrentTime =
    isThisEpisodeInThePlayer && !isThisEpisodePaused && isLoadingAtCurrentTime;

  const handlePlayPauseClick = async () => {
    if (enclosureUrl === undefined) {
      return;
    }

    const nextIsPaused = !isThisEpisodePaused;

    // Two episodes can share an enclosure URL, so a match of `src` alone does
    // not show that this episode is in the player.
    if (!nextIsPaused && (!isThisEpisodeInThePlayer || enclosureUrl !== src)) {
      setChaptersUrl(episode.chaptersUrl ?? null);
      setCurrentTime(episodeCurrentTime);
      setEpisodeIdentity(episode.identity);
      setEpisodeImage(episode.image ?? null);
      setEpisodeImageDimensions(episodeImageDimensions ?? null);
      setEpisodeTitle(episode.title);
      setFeedImage(episode.feedImage ?? null);
      setFeedTitle(episode.feedTitle);
      setFeedUrl(episode.feedUrl);
      setSrc(enclosureUrl);
      setSrcType(episode.enclosureType ?? null);
      setSize(isVideo ? 2 : 1);
    }

    setIsPaused(nextIsPaused);

    if (audioRef.current) {
      if (nextIsPaused) {
        audioRef.current.pause();
      } else {
        if (didError) {
          setDidError(false);
          audioRef.current.load();
        }

        await audioRef.current.play();
      }
    }

    if (videoRef.current) {
      if (nextIsPaused) {
        videoRef.current.pause();
      } else {
        if (didError) {
          setDidError(false);
          videoRef.current.load();
        }

        await videoRef.current.play();
      }
    }
  };

  return (
    <Stack
      kind="flexRow"
      align="center"
      justify="center"
      style={{ width: 'auto' }}
      space="xsmall"
    >
      <Stack
        aria-label={isThisEpisodePaused ? 'Play podcast' : 'Pause podcast'}
        as="button"
        disabled={enclosureUrl === undefined}
        kind="flexRow"
        space="small"
        align="center"
        justify="center"
        style={{
          background: 'none',
          cursor: 'pointer',
          width: 'auto',
        }}
        onClick={handlePlayPauseClick}
        type="button"
      >
        <IconButton as="span" background="circle" size="medium">
          <PlayPauseIcon
            size="medium"
            isPaused={isThisEpisodePaused}
            isLoading={isThisEpisodeLoadingAtCurrentTime}
          />
        </IconButton>
        <Typography
          className="font-bold"
          size="headingSmaller"
          as="h3"
          whitespace={2}
        >
          {episode.explicit === true ? (
            <Icon
              style={{ verticalAlign: 'middle' }}
              as={ExplicitIcon}
              size="smallMedium"
            />
          ) : null}{' '}
          {currentChapter?.title ?? episode.title}
        </Typography>
      </Stack>
      {currentChapter?.url && (
        <ExternalLink href={currentChapter.url}>
          <Icon size="medium">
            <ChapterLinkIcon />
          </Icon>
        </ExternalLink>
      )}
    </Stack>
  );
};
