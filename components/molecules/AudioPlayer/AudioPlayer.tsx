import { FunctionComponent, ReactEventHandler, useEffect } from 'react';

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
import CircleDownIcon from 'icons/circle-down.svg';
import CircleUpIcon from 'icons/circle-up.svg';
import SpinnerIcon from 'icons/spinner11.svg';
import { underlinedLink } from 'styles';
import {
  iconButton,
  player,
  playerButtons,
  playerMinimize,
  playerTitleClassName,
  volumeLayout,
} from 'styles/episodeId.css';

export const AudioPlayer: FunctionComponent = () => {
  const {
    audioPlayerCurrentTime,
    audioRef,
    currentChapter,
    currentTime,
    episodeTitle,
    isMuted,
    isPaused,
    isPlayerOpen,
    setAudioPlayerCurrentTime,
    setCurrentTime,
    setIsMuted,
    setIsPaused,
    setIsPlayerOpen,
    setVolume,
    src,
    volume,
  } = useAudioContext() || audioContextDefaults;

  const playerTitle = currentChapter?.title ?? episodeTitle;

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
      <div
        style={
          {
            // margin: `${calc(vars.spacing.s016).negate().toString()}`,
          }
        }
      >
        <Stack className={player} space="small">
          {playerTitle && isPlayerOpen && (
            <Typography
              size="headingSmaller"
              as="h4"
              textAlign="center"
              whitespace="ellipsis"
              shouldUseCapsize={false}
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
                  {playerTitle}
                </Link>
              ) : (
                playerTitle
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
            title={playerTitle ?? undefined}
            isTitleVisible={!isPlayerOpen}
          />
          <div className={playerButtons}>
            <Stack
              align="center"
              justify="center"
              kind="flexRow"
              space="small"
              style={{ gridColumnStart: '2' }}
            >
              <IconButton
                background="circle"
                label={'Rewind 15 seconds'}
                onClick={handleRewindClick}
                size={isPlayerOpen ? 'medium' : 'small'}
              >
                <Icon
                  size={isPlayerOpen ? 'medium' : 'small'}
                  orientation="reverse"
                >
                  <SpinnerIcon />
                </Icon>
              </IconButton>
              <IconButton
                background="circle"
                label={isPaused ? 'Play podcast' : 'Pause podcast'}
                onClick={handlePlayPauseClick}
                size={isPlayerOpen ? 'large' : 'medium'}
              >
                <PlayPauseIcon
                  size={isPlayerOpen ? 'large' : 'medium'}
                  isPaused={isPaused}
                />
              </IconButton>
              <IconButton
                background="circle"
                label={'Skip 30 seconds'}
                onClick={handleSkipClick}
                size={isPlayerOpen ? 'medium' : 'small'}
              >
                <Icon size={isPlayerOpen ? 'medium' : 'small'}>
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
                {isPlayerOpen ? <CircleDownIcon /> : <CircleUpIcon />}
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
      </div>
    </Stack>
  );
};
