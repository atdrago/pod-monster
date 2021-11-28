import { FunctionComponent, ReactEventHandler, useEffect } from 'react';

import { Artwork } from 'components/atoms/Artwork';
import { Audio } from 'components/atoms/Audio';
import { Icon } from 'components/atoms/Icon';
import { IconButton } from 'components/atoms/IconButton';
import { Link } from 'components/atoms/Link';
import { PlayPauseIcon } from 'components/atoms/PlayPauseIcon';
import { Range } from 'components/atoms/Range';
import { Typography } from 'components/atoms/Typography';
import { VolumeIcon } from 'components/atoms/VolumeIcon';
import { Stack } from 'components/layouts/Stack';
import { audioContextDefaults, useAudioContext } from 'contexts/AudioContext';
import { useIsMobileDevice } from 'hooks/useIsMobileDevice';
import EnlargeIcon from 'icons/enlarge2.svg';
import ShrinkIcon from 'icons/shrink2.svg';
import SpinnerIcon from 'icons/spinner11.svg';
import StopIcon from 'icons/stop.svg';
import { underlinedLink } from 'styles';
import {
  iconButton,
  player,
  playerButtons,
  playerMinimize,
  playerTitleClassName,
  volumeLayout,
} from 'styles/episodeId.css';
import { getEpisodePath } from 'utils/paths';

export const AudioPlayer: FunctionComponent = () => {
  const {
    audioPlayerCurrentTime,
    audioRef,
    currentChapter,
    currentTime,
    episodeId,
    episodeImage,
    episodeTitle,
    feedId,
    feedImage,
    feedTitle,
    isMuted,
    isPaused,
    isPlayerOpen,
    resetAudioContext,
    setAudioPlayerCurrentTime,
    setCurrentTime,
    setIsMuted,
    setIsPaused,
    setIsPlayerOpen,
    setVolume,
    src,
    volume,
  } = useAudioContext() || audioContextDefaults;

  const playerArtwork = currentChapter?.img || episodeImage || feedImage;
  const playerArtworkProxyUrl = new URL(
    '/api/images/proxy',
    process.env.NEXT_PUBLIC_BASE_URL
  );

  if (playerArtwork) {
    playerArtworkProxyUrl.searchParams.set('url', playerArtwork);
  }

  const isMobileDevice = useIsMobileDevice();

  const handleLoadedMetaData: ReactEventHandler<HTMLAudioElement> =
    async () => {
      if (audioRef.current) {
        if (audioRef.current.paused && !isPaused) {
          await audioRef.current.play();
        }
      }
    };

  const handleLoadedData: ReactEventHandler<HTMLAudioElement> = async () => {
    if (audioRef.current) {
      if (audioRef.current.paused && !isPaused) {
        await audioRef.current.play();
      }
    }
  };

  const handleRewindClick = () => {
    const resultTime = audioPlayerCurrentTime - 15;

    setCurrentTime(resultTime);
  };

  const handleSkipClick = () => {
    const resultTime = audioPlayerCurrentTime + 30;

    setCurrentTime(resultTime);
  };

  const handlePlayPauseClick = async () => {
    setIsPaused(!isPaused);

    if (audioRef.current) {
      if (!isPaused) {
        audioRef.current.pause();
      } else {
        await audioRef.current.play();
      }
    }
  };

  const handleVolumeRangeChange: ReactEventHandler<HTMLInputElement> = (
    event
  ) => {
    if (audioRef.current) {
      audioRef.current.volume = event.currentTarget.valueAsNumber;
    }

    setVolume(event.currentTarget.valueAsNumber);
  };

  const handleMuteClick: ReactEventHandler<HTMLButtonElement> = () => {
    if (audioRef.current) {
      if (audioRef.current.muted) {
        audioRef.current.muted = false;
      } else {
        audioRef.current.muted = true;
      }
    }

    setIsMuted(audioRef.current?.muted ?? false);
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = currentTime;
    }

    setAudioPlayerCurrentTime(currentTime);
  }, [audioRef, currentTime, setAudioPlayerCurrentTime]);

  if (!src) {
    return null;
  }

  return (
    <Stack
      maxWidth="small"
      style={{
        bottom: 0,
        position: 'sticky',
        top: 0,
        zIndex: 1,
      }}
    >
      <Stack className={player} space="small">
        {isPlayerOpen && episodeTitle ? (
          <Typography
            size="headingSmaller"
            as="h4"
            textAlign="center"
            whitespace="ellipsis"
            className={playerTitleClassName}
          >
            {episodeId && feedId ? (
              <Link
                className={underlinedLink}
                href={getEpisodePath({ episodeId, feedId })}
              >
                {episodeTitle}
              </Link>
            ) : (
              episodeTitle
            )}
          </Typography>
        ) : null}
        {isPlayerOpen && playerArtwork ? (
          <Artwork
            alt=""
            edge="overflow"
            src={playerArtworkProxyUrl.toString()}
          />
        ) : null}
        {isPlayerOpen && currentChapter && currentChapter.title && (
          <Typography
            size="paragraph"
            as="h5"
            textAlign="center"
            whitespace="ellipsis"
            className={playerTitleClassName}
          >
            {currentChapter?.url ? (
              <Link
                anchorProps={{
                  rel: 'noreferrer noopener',
                  target: '_blank',
                }}
                className={underlinedLink}
                href={currentChapter?.url}
              >
                {currentChapter.title}
              </Link>
            ) : (
              currentChapter.title
            )}
          </Typography>
        )}
        <Audio
          audioRef={audioRef}
          controls={true}
          currentTime={audioPlayerCurrentTime}
          onCurrentTimeChange={setAudioPlayerCurrentTime}
          onLoadedData={handleLoadedData}
          onLoadedMetadata={handleLoadedMetaData}
          onPause={() => setIsPaused(true)}
          onPlay={() => setIsPaused(false)}
          onVolumeChange={(event) => setVolume(event.currentTarget.volume)}
          preload="metadata"
          src={src}
          startTime={currentTime}
          title={feedTitle ?? ''}
          isTitleVisible={!!feedTitle}
        />
        <div className={playerButtons}>
          <IconButton
            label={'Stop'}
            onClick={() => resetAudioContext()}
            size="small"
          >
            <Icon size="medium">
              <StopIcon />
            </Icon>
          </IconButton>
          <Stack align="center" justify="center" kind="flexRow" space="small">
            <IconButton
              background="circle"
              label={'Rewind 15 seconds'}
              onClick={handleRewindClick}
              size={'small'}
            >
              <Icon size={'small'} orientation="reverse">
                <SpinnerIcon />
              </Icon>
            </IconButton>
            <IconButton
              background="circle"
              label={isPaused ? 'Play podcast' : 'Pause podcast'}
              onClick={handlePlayPauseClick}
              size={'medium'}
            >
              <PlayPauseIcon size={'medium'} isPaused={isPaused} />
            </IconButton>
            <IconButton
              background="circle"
              label={'Skip 30 seconds'}
              onClick={handleSkipClick}
              size={'small'}
            >
              <Icon size={'small'}>
                <SpinnerIcon />
              </Icon>
            </IconButton>
          </Stack>
          <IconButton
            label={isPlayerOpen ? 'Collapse player' : 'Open player'}
            onClick={() => setIsPlayerOpen(!isPlayerOpen)}
            size="small"
            className={playerMinimize}
          >
            <Icon size="small">
              {isPlayerOpen ? <ShrinkIcon /> : <EnlargeIcon />}
            </Icon>
          </IconButton>
        </div>
        {!isMobileDevice && isPlayerOpen && (
          <div className={volumeLayout}>
            <button
              aria-label="Mute"
              className={iconButton}
              type="button"
              onClick={handleMuteClick}
            >
              <VolumeIcon isMuted={isMuted} volume={volume} />
            </button>
            <Range
              onChange={handleVolumeRangeChange}
              max="1"
              min="0"
              step="0.01"
              value={volume}
              variant="volume"
            />
          </div>
        )}
      </Stack>
    </Stack>
  );
};
