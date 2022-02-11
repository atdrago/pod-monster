import { ExternalLink } from 'components/atoms/ExternalLink';
import { Icon } from 'components/atoms/Icon';
import { IconButton } from 'components/atoms/IconButton';
import { PlayPauseIcon } from 'components/atoms/PlayPauseIcon';
import { Typography } from 'components/atoms/Typography';
import { Stack } from 'components/layouts/Stack';
import { useMediaContext } from 'contexts/MediaContext';
import ChapterLinkIcon from 'icons/arrow-up-right2.svg';
import ExplicitIcon from 'icons/explicit.svg';
import type { EpisodePageEpisode, IChapter, IImageDimensions } from 'types';

interface IEpisodePlayButtonProps {
  currentChapter: IChapter | null;
  episode?: EpisodePageEpisode;
  episodeCurrentTime: number;
  episodeImageDimensions?: IImageDimensions;
  isVideo?: boolean;
}

export const EpisodePlayButton = ({
  currentChapter,
  episode,
  episodeCurrentTime,
  episodeImageDimensions,
  isVideo,
}: IEpisodePlayButtonProps) => {
  const {
    audioRef,
    didError,
    episodeId,
    isLoadingAtCurrentTime,
    isPaused,
    setChaptersUrl,
    setCurrentTime,
    setDateCrawled,
    setDidError,
    setEpisodeId,
    setEpisodeImage,
    setEpisodeImageDimensions,
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
  } = useMediaContext();

  const isThisEpisodeInThePlayer = episodeId === episode?.id;
  const isThisEpisodePaused = isPaused || !isThisEpisodeInThePlayer;
  const isThisEpisodeLoadingAtCurrentTime =
    isThisEpisodeInThePlayer && !isThisEpisodePaused && isLoadingAtCurrentTime;

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
      setEpisodeImageDimensions(episodeImageDimensions ?? null);
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
          <PlayPauseIcon
            size="medium"
            isPaused={isThisEpisodePaused}
            isLoading={isThisEpisodeLoadingAtCurrentTime}
          />
        </IconButton>
        <Typography size="headingSmaller" as="h3" whitespace={2}>
          {episode && episode.explicit > 0 ? (
            <Icon
              style={{ verticalAlign: 'middle' }}
              as={ExplicitIcon}
              size="smallMedium"
            />
          ) : null}{' '}
          {currentChapter?.title ?? episode?.title}
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
