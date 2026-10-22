import { ExternalLink } from 'components/atoms/ExternalLink';
import { Icon } from 'components/atoms/Icon';
import { IconButton } from 'components/atoms/IconButton';
import { PlayPauseIcon } from 'components/atoms/PlayPauseIcon';
import { Typography } from 'components/atoms/Typography';
import { Stack } from 'components/layouts/Stack';
import { useMediaContext } from 'contexts/MediaContext';
import { useSettingsContext } from 'contexts/SettingsContext';
import { usePlayEpisodeAt } from 'hooks/usePlayEpisodeAt';
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
  episodeImageDimensions?: ImageDimensions;
  isVideo?: boolean;
  /** Runs when a click starts this episode, and not when a click pauses it. */
  onPlay?: () => void;
  /**
   * The time that the visitor picked on the page, for example a chapter, for
   * an episode that is not in the player. With no time, the episode starts
   * from its saved position.
   */
  startTime?: number;
}

export const EpisodePlayButton = ({
  currentChapter,
  episode,
  episodeImageDimensions,
  isVideo,
  onPlay,
  startTime,
}: EpisodePlayButtonProps) => {
  const {
    audioRef,
    episodeIdentity,
    feedUrl,
    isLoadingAtCurrentTime,
    isPaused,
    setIsPaused,
    videoRef,
  } = useMediaContext();
  const { isDoneHydratingFromIdb } = useSettingsContext();
  const playEpisodeAt = usePlayEpisodeAt({
    episode,
    episodeImageDimensions,
    isVideo,
  });

  const { enclosureUrl } = episode;
  const isThisEpisodeInThePlayer =
    episodeIdentity === episode.identity && feedUrl === episode.feedUrl;
  const isThisEpisodePaused = isPaused || !isThisEpisodeInThePlayer;
  const isThisEpisodeLoadingAtCurrentTime =
    isThisEpisodeInThePlayer && !isThisEpisodePaused && isLoadingAtCurrentTime;

  const handlePlayPauseClick = async () => {
    if (enclosureUrl === undefined || !isDoneHydratingFromIdb) {
      return;
    }

    if (isThisEpisodePaused) {
      onPlay?.();
      // An episode in the player plays on from where it is. The time of the
      // page applies only when the episode loads.
      await playEpisodeAt(isThisEpisodeInThePlayer ? undefined : startTime);

      return;
    }

    setIsPaused(true);
    audioRef.current?.pause();
    videoRef.current?.pause();
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
        disabled={enclosureUrl === undefined || !isDoneHydratingFromIdb}
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
        // TODO: The icon sits on a text line. This 10px text size keeps the
        // legacy height of that line. Remove it in a unit that names the image
        // change.
        <ExternalLink className="text-[10px]" href={currentChapter.url}>
          <Icon size="medium">
            <ChapterLinkIcon />
          </Icon>
        </ExternalLink>
      )}
    </Stack>
  );
};
