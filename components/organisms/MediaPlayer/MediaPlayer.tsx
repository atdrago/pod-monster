import { AnimatePresence, m } from 'framer-motion';
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
import { Link } from 'components/atoms/Link';
import { PlayPauseIcon } from 'components/atoms/PlayPauseIcon';
import { Range } from 'components/atoms/Range';
import { Typography } from 'components/atoms/Typography';
import { VolumeIcon } from 'components/atoms/VolumeIcon';
import { Stack } from 'components/layouts/Stack';
import { Media } from 'components/molecules/Media';
import { SizeField } from 'components/molecules/SizeField';
import { mediaContextDefaults, useMediaContext } from 'contexts/MediaContext';
import { useClassNames } from 'hooks/useClassNames';
import { useIsMobileDevice } from 'hooks/useIsMobileDevice';
import SpinnerIcon from 'icons/spinner11.svg';
import StopIcon from 'icons/stop.svg';
import { underlinedLink } from 'styles';
import { getEpisodePath } from 'utils/paths';

import {
  iconButton,
  intersectionObserverClassName,
  player,
  playerButtons,
  playerElevatedVariant,
  volumeLayout,
} from './mediaPlayer.css';

export const MediaPlayer: FunctionComponent = () => {
  const {
    audioRef,
    chapters,
    currentChapter,
    currentTime,
    episodeId,
    episodeImage,
    episodeImageDimensions,
    episodeTitle,
    feedId,
    feedImage,
    feedTitle,
    isMuted,
    isPaused,
    mediaPlayerCurrentTime,
    playPause,
    resetMediaContext,
    seekBackward,
    seekForward,
    setIsMuted,
    setIsPaused,
    setMediaPlayerCurrentTime,
    setSize,
    setVolume,
    size,
    src,
    srcType,
    videoRef,
    volume,
  } = useMediaContext() || mediaContextDefaults;
  const intersectionObserverRef = useRef<HTMLDivElement | null>(null);
  const [isPinned, setIsPinned] = useState(false);
  const playerClassName = useClassNames(
    player,
    playerElevatedVariant[isPinned ? 'elevated' : 'inset']
  );

  const playerArtwork = currentChapter?.img || episodeImage || feedImage;
  const playerArtworkProxyUrl = new URL(
    '/api/images/proxy',
    process.env.NEXT_PUBLIC_BASE_URL
  );

  if (playerArtwork) {
    playerArtworkProxyUrl.searchParams.set('url', playerArtwork);
  }

  const isMobileDevice = useIsMobileDevice();

  const handleLoadedMetaData: ReactEventHandler<
    HTMLMediaElement
  > = async () => {
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
  };

  const handleLoadedData: ReactEventHandler<HTMLMediaElement> = async () => {
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
  };

  const handleVolumeRangeChange: ReactEventHandler<HTMLInputElement> = (
    event
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
      { threshold: [1] }
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

  const animationProperties = {
    animate: { height: 'auto', marginBottom: 0, opacity: 1 },
    exit: { height: 0, marginBottom: -16, opacity: 0 },
    initial: { height: 0, marginBottom: -16, opacity: 0 },
    style: { overflow: 'hidden' },
  };

  const isVideo = srcType && srcType.includes('video');
  const hasChapters = chapters && chapters.length > 0;

  return (
    <AnimatePresence>
      {src && (
        <Stack
          as={m.aside}
          maxWidth="small"
          animate={{ opacity: 1, y: '0' }}
          initial={{ opacity: 0, y: '100%' }}
          exit={{ opacity: 0, y: '100%' }}
          style={{
            bottom: 16,
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

                  {currentChapter && currentChapter.title && (
                    <Typography
                      size="paragraph"
                      as="h5"
                      textAlign="center"
                      whitespace="ellipsis"
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
                  {!isVideo && playerArtwork ? (
                    <Artwork
                      alt=""
                      edge="overflow"
                      height={episodeImageDimensions?.height}
                      isSquare={!!episodeImageDimensions && !!hasChapters}
                      src={playerArtworkProxyUrl.toString()}
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
              onEnded={() => setIsPaused(true)}
              onLoadedData={handleLoadedData}
              onLoadedMetadata={handleLoadedMetaData}
              onPause={() => setIsPaused(true)}
              onPlay={() => setIsPaused(false)}
              onPlaying={() => setIsPaused(false)}
              onVolumeChange={(event) => setVolume(event.currentTarget.volume)}
              poster={playerArtworkProxyUrl?.toString()}
              src={src}
              srcType={srcType ?? undefined}
              startTime={currentTime}
              title={feedTitle ?? ''}
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
                  <PlayPauseIcon size={'medium'} isPaused={isPaused} />
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
        </Stack>
      )}
    </AnimatePresence>
  );
};
