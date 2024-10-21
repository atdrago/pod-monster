'use client';

import { AnimatePresence, m } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FunctionComponent,
  ReactEventHandler,
  useEffect,
  useRef,
  useState,
} from 'react';

import { Artwork } from 'components/atoms/Artwork';
import { Icon } from 'components/atoms/Icon';
import { IconButton } from 'components/atoms/IconButton';
import { PlayPauseIcon } from 'components/atoms/PlayPauseIcon';
import { Range } from 'components/atoms/Range';
import { Typography } from 'components/atoms/Typography';
import { VolumeIcon } from 'components/atoms/VolumeIcon';
import { Stack } from 'components/layouts/Stack';
import { Media } from 'components/molecules/Media';
import { SelectField } from 'components/molecules/SelectField';
import { SizeField } from 'components/molecules/SizeField';
import { useMediaContext } from 'contexts/MediaContext';
import { useClassNames } from 'hooks/useClassNames';
import { useIsMobileDevice } from 'hooks/useIsMobileDevice';
import SpinnerIcon from 'icons/spinner11.svg';
import StopIcon from 'icons/stop.svg';
import { underlinedLink } from 'styles';
import { bufferedTimeRangesToTuples } from 'utils/bufferedTimeRangesToTuples';
import { getEpisodePath } from 'utils/paths';
import { playbackRates, type PlaybackRate } from 'utils/playbackRates';

import {
  iconButton,
  intersectionObserverClassName,
  playbackRateContainer,
  player,
  playerButtons,
  playerElevatedVariant,
  volumeLayout,
  containerPinnedVariant,
} from './mediaPlayer.css';

const rateDecimalToFraction = (rate: PlaybackRate): string => {
  switch (rate) {
    case 0.25:
      return '¼';
    case 0.5:
      return '½';
    case 0.75:
      return '¾';
    case 1.25:
      return '1¼';
    case 1.5:
      return '1½';
    case 1.75:
      return '1¾';
    case 1:
    case 2:
    default:
      return `${rate}`;
  }
};

const fractionToPlaybackRate = (fraction: string): PlaybackRate | null => {
  switch (fraction) {
    case '¼':
      return 0.25;
    case '½':
      return 0.5;
    case '¾':
      return 0.75;
    case '1¼':
      return 1.25;
    case '1½':
      return 1.5;
    case '1¾':
      return 1.75;
    case '1':
      return 1;
    case '2':
      return 2;
    default:
      return null;
  }
};

export const MediaPlayer: FunctionComponent = () => {
  const {
    audioRef,
    chapters,
    currentChapter,
    currentTime,
    didError,
    episodeId,
    episodeImage,
    episodeImageDimensions,
    episodeTitle,
    feedId,
    feedImage,
    feedTitle,
    isLoadingAtCurrentTime,
    isMuted,
    isPaused,
    mediaPlayerCurrentTime,
    pause,
    playPause,
    playbackRate,
    resetMediaContext,
    seekBackward,
    seekForward,
    setDidError,
    setDuration,
    setIsMuted,
    setIsPaused,
    setMediaPlayerCurrentTime,
    setPlaybackRate,
    setProgressEventBufferedTuples,
    setSize,
    setVolume,
    size,
    src,
    srcType,
    videoRef,
    volume,
  } = useMediaContext();
  const intersectionObserverRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();
  const [isPinned, setIsPinned] = useState(false);
  const playerClassName = useClassNames(
    player,
    playerElevatedVariant[isPinned ? 'elevated' : 'inset'],
  );

  const playerArtwork = currentChapter?.img || episodeImage || feedImage;

  const isMobileDevice = useIsMobileDevice();

  const handleError: ReactEventHandler<HTMLMediaElement> = async () => {
    pause();
    setDidError(true);
  };

  const handleLoadedData: ReactEventHandler<HTMLMediaElement> = async (
    event,
  ) => {
    if (audioRef.current) {
      if (audioRef.current.paused && !isPaused) {
        await audioRef.current.play();
      }
    }

    if (videoRef.current) {
      if (videoRef.current.paused && !isPaused) {
        await videoRef.current.play();
      }
    }

    if (
      event.currentTarget?.duration &&
      event.currentTarget.duration !== Infinity
    ) {
      setDuration(event.currentTarget.duration);
    }
  };

  const handleVolumeRangeChange: ReactEventHandler<HTMLInputElement> = (
    event,
  ) => {
    if (audioRef.current) {
      audioRef.current.volume = event.currentTarget.valueAsNumber;
    }

    if (videoRef.current) {
      videoRef.current.volume = event.currentTarget.valueAsNumber;
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

    if (videoRef.current) {
      if (videoRef.current.muted) {
        videoRef.current.muted = false;
      } else {
        videoRef.current.muted = true;
      }
    }

    setIsMuted(audioRef.current?.muted ?? videoRef.current?.muted ?? false);
  };

  useEffect(() => {
    const ref = intersectionObserverRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsPinned(entry.intersectionRatio < 1);
      },
      { threshold: [1] },
    );

    if (ref) {
      observer.observe(ref);
    }

    return () => {
      if (ref) {
        observer.unobserve(ref);
      }
    };
  }, [src]);

  const isPlayingEpisodeOfCurrentPage =
    episodeId &&
    feedId &&
    // TODO: Check that this is the path name and not the route id
    pathname?.includes(getEpisodePath({ episodeId, feedId }));

  const animationProperties = {
    animate: {
      height: 'auto',
      marginBottom: 0,
      opacity: 1,
      overflow: 'visible',
    },
    enter: { height: 'auto', marginBottom: 0, opacity: 1, overflow: 'hidden' },
    exit: { height: 0, marginBottom: -16, opacity: 0, overflow: 'hidden' },
    initial: { height: 0, marginBottom: -16, opacity: 0, overflow: 'hidden' },
  };

  const isVideo = srcType && srcType.includes('video');
  const hasChapters = chapters && chapters.length > 0;

  return (
    <AnimatePresence>
      {src && (
        <m.aside
          className={containerPinnedVariant[isPinned ? 'pinned' : 'unpinned']}
          animate={{
            height: 'auto',
            marginBottom: 0,
            marginTop: 0,
            opacity: 1,
            y: '0',
          }}
          initial={{
            height: 'auto',
            marginBottom: 0,
            marginTop: 0,
            opacity: 0,
            y: '100%',
          }}
          exit={{
            height: '0',
            marginBottom: '-16px',
            marginTop: '-16px',
            opacity: 0,
            y: '100%',
          }}
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 1,
          }}
        >
          <div
            className={intersectionObserverClassName}
            ref={intersectionObserverRef}
          ></div>
          <Stack as={m.div} className={playerClassName} space="small">
            <AnimatePresence>
              {size === 2 && (
                <Stack as={m.div} space="small" {...animationProperties}>
                  {episodeTitle ? (
                    <Typography
                      size="headingSmaller"
                      as="h4"
                      textAlign="center"
                      whitespace="ellipsis"
                    >
                      {episodeId && feedId && !isPlayingEpisodeOfCurrentPage ? (
                        <Link
                          className={underlinedLink}
                          href={getEpisodePath({ episodeId, feedId })}
                          onClick={() => {
                            setSize(1);
                          }}
                        >
                          {episodeTitle}
                        </Link>
                      ) : (
                        episodeTitle
                      )}
                    </Typography>
                  ) : null}
                  {currentChapter && currentChapter.title && (
                    <Typography
                      size="paragraph"
                      as="h5"
                      textAlign="center"
                      whitespace="ellipsis"
                    >
                      {currentChapter?.url ? (
                        <Link
                          rel="noreferrer noopener"
                          target="_blank"
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
                  {!isVideo && playerArtwork ? (
                    <Artwork
                      alt=""
                      height={episodeImageDimensions?.height}
                      isSquare={!!episodeImageDimensions && !!hasChapters}
                      src={playerArtwork}
                      width={episodeImageDimensions?.width}
                    />
                  ) : null}
                </Stack>
              )}
            </AnimatePresence>
            {/**
             * 1. Waiting
             * 2. Suspend
             * 3. CanPlay
             * 4. Playing
             */}
            <Media
              audioRef={audioRef}
              currentTime={mediaPlayerCurrentTime}
              isTitleVisible={!!feedTitle}
              isVideoVisible={size === 2}
              onCurrentTimeChange={setMediaPlayerCurrentTime}
              onAbort={pause}
              onEnded={pause}
              onError={handleError}
              onLoadedData={handleLoadedData}
              onLoadedMetadata={handleLoadedData}
              onPause={() => setIsPaused(true)}
              onPlay={() => setIsPaused(false)}
              onPlaying={() => setIsPaused(false)}
              onVolumeChange={(event) => setVolume(event.currentTarget.volume)}
              onProgress={(event) => {
                setProgressEventBufferedTuples(
                  bufferedTimeRangesToTuples(event.currentTarget.buffered),
                );
              }}
              playbackRate={playbackRate}
              poster={playerArtwork ?? undefined}
              src={src}
              srcType={srcType ?? undefined}
              startTime={currentTime}
              title={
                didError
                  ? '⚠️ Failed to load episode. Press play to retry.'
                  : (feedTitle ?? '')
              }
              videoRef={videoRef}
            />
            <AnimatePresence>
              {!isMobileDevice && !isVideo && size === 2 && (
                <m.div className={volumeLayout} {...animationProperties}>
                  <button
                    aria-label="Mute"
                    className={iconButton}
                    type="button"
                    onClick={handleMuteClick}
                  >
                    <VolumeIcon isMuted={isMuted} volume={volume} />
                  </button>
                  <Range
                    aria-label="Volume"
                    onChange={handleVolumeRangeChange}
                    max="1"
                    min="0"
                    step="0.01"
                    value={volume}
                    variant="volume"
                  />
                </m.div>
              )}
            </AnimatePresence>
            <div className={playerButtons}>
              <IconButton
                label={'Stop'}
                onClick={resetMediaContext}
                size="small"
              >
                <Icon size="medium">
                  <StopIcon />
                </Icon>
              </IconButton>
              <Stack
                align="center"
                justify="center"
                kind="flexRow"
                space="small"
                style={{ gridColumnStart: 3 }}
              >
                <IconButton
                  background="circle"
                  label={'Rewind 15 seconds'}
                  onClick={() => seekBackward({ seekOffset: 15 })}
                  size={'small'}
                >
                  <Icon size={'small'} orientation="reverse">
                    <SpinnerIcon />
                  </Icon>
                </IconButton>
                <IconButton
                  background="circle"
                  label={isPaused ? 'Play podcast' : 'Pause podcast'}
                  onClick={playPause}
                  size={'medium'}
                >
                  <PlayPauseIcon
                    size="medium"
                    isPaused={isPaused}
                    isLoading={isLoadingAtCurrentTime}
                  />
                </IconButton>
                <IconButton
                  background="circle"
                  label={'Skip 30 seconds'}
                  onClick={() => seekForward({ seekOffset: 30 })}
                  size={'small'}
                >
                  <Icon size={'small'}>
                    <SpinnerIcon />
                  </Icon>
                </IconButton>
              </Stack>
              <div className={playbackRateContainer}>
                <SelectField
                  value={rateDecimalToFraction(playbackRate)}
                  label={`${rateDecimalToFraction(playbackRate)}x`}
                  onChange={(event) => {
                    const nextPlaybackRate = fractionToPlaybackRate(
                      event.currentTarget.value,
                    );

                    if (nextPlaybackRate) {
                      setPlaybackRate(nextPlaybackRate);
                    }
                  }}
                >
                  {playbackRates.map((rate) => {
                    return (
                      <option key={rate} value={rateDecimalToFraction(rate)}>
                        {rateDecimalToFraction(rate)}
                      </option>
                    );
                  })}
                </SelectField>
              </div>
              <SizeField
                label="Player size"
                value={size}
                step={1}
                max={2}
                min={1}
                onChange={(value) => {
                  if (value === 1 || value === 2) {
                    setSize(value);
                  }
                }}
              />
            </div>
          </Stack>
        </m.aside>
      )}
    </AnimatePresence>
  );
};
