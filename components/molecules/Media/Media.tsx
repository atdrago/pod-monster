import { m } from 'framer-motion';
import {
  FunctionComponent,
  ReactEventHandler,
  useEffect,
  useState,
} from 'react';

import { Range } from 'components/atoms/Range';
import { Typography } from 'components/atoms/Typography';
import { useClassNames } from 'hooks/useClassNames';
import { useUniqueId } from 'hooks/useUniqueId';
import type { MediaProps } from 'types';
import { secondsToFormattedTime } from 'utils/date';

import {
  audio,
  labelLayout,
  mediaBase,
  timeLabel,
  timeLabelCenter,
  timeLabelRight,
} from './media.css';

export const Media: FunctionComponent<MediaProps> = function MediaRef({
  audioRef,
  className,
  currentTime = 0,
  isTitleVisible = true,
  isVideoVisible = true,
  onCurrentTimeChange = () => ({}),
  onLoadedData = () => ({}),
  onLoadedMetadata = () => ({}),
  onEnded = () => ({}),
  onError = () => ({}),
  onPause = () => ({}),
  onPlay = () => ({}),
  onPlaying = () => ({}),
  onVolumeChange = () => ({}),
  playbackRate = 1,
  poster,
  src,
  srcType,
  startTime = 0,
  title,
  videoRef,
}) {
  const audioClassName = useClassNames(audio, className);
  const [duration, setDuration] = useState(0);
  const id = useUniqueId();

  const handleTimeUpdate: ReactEventHandler<HTMLMediaElement> = (event) => {
    onCurrentTimeChange(event.currentTarget.currentTime);
  };

  /**
   * After the media file loads, set its currentTime to the `start` query
   * string parameter. This must be done after the media file has loaded,
   * and fixes an iOS-specific bug, as opposed to setting the currentTime
   * immediately when the page mounts.
   */
  const handleLoadedMetaData: ReactEventHandler<HTMLMediaElement> = (event) => {
    if (audioRef.current) {
      audioRef.current.currentTime = startTime;
    }

    if (videoRef.current) {
      videoRef.current.currentTime = startTime;
    }

    if (
      event.currentTarget.duration &&
      event.currentTarget.duration !== Infinity
    ) {
      setDuration(event.currentTarget.duration);
    }

    onLoadedMetadata(event);
  };

  /**
   * After the media file loads, set its currentTime to the `start` query
   * string parameter. This must be done after the media file has loaded,
   * and fixes an iOS-specific bug, as opposed to setting the currentTime
   * immediately when the page mounts.
   */
  const handleLoadedData: ReactEventHandler<HTMLMediaElement> = (event) => {
    if (audioRef.current) {
      audioRef.current.currentTime = startTime;
    }

    if (videoRef.current) {
      videoRef.current.currentTime = startTime;
    }

    if (
      event.currentTarget.duration &&
      event.currentTarget.duration !== Infinity
    ) {
      setDuration(event.currentTarget.duration);
    }

    onLoadedData(event);
  };

  const handleMediaRangeChange: ReactEventHandler<HTMLInputElement> = (
    event
  ) => {
    if (audioRef.current) {
      audioRef.current.currentTime = event.currentTarget.valueAsNumber;
    }

    if (videoRef.current) {
      videoRef.current.currentTime = event.currentTarget.valueAsNumber;
    }

    onCurrentTimeChange(event.currentTarget.valueAsNumber);
  };

  /**
   * Update the duration string if the media element's `duration` property
   * changes
   */
  useEffect(() => {
    // If `onLoadedMetadata` doesn't fire, this will set the duration for us
    const nextDuration =
      audioRef.current?.duration ?? videoRef.current?.duration ?? 0;

    if (nextDuration) {
      // Sometimes it's NaN...
      setDuration(
        isNaN(nextDuration) || nextDuration === Infinity ? 0 : nextDuration
      );
    }
  }, [
    audioRef,
    audioRef.current?.duration,
    videoRef,
    videoRef.current?.duration,
  ]);

  /**
   * As a back-up to on the onLoad* events, set the media element's
   * `currentTime` property to `startTime`
   */
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = startTime;
    }

    if (videoRef.current) {
      videoRef.current.currentTime = startTime;
    }
    // We only want to set the current time when the component mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Update the playbackRate whenever it changes
   */
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }

    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [audioRef, playbackRate, videoRef, src]);

  return (
    <>
      {srcType?.includes('video') ? (
        <m.div
          animate={{
            height: isVideoVisible ? 'auto' : 0,
            marginBottom: isVideoVisible ? 0 : -16,
            overflow: 'hidden',
          }}
        >
          <video
            autopictureinpicture=""
            key={src}
            controls={true}
            onEnded={onEnded}
            onError={onError}
            onLoadedData={handleLoadedData}
            onLoadedMetadata={handleLoadedMetaData}
            onPause={onPause}
            onPlay={onPlay}
            onPlaying={onPlaying}
            onSeeking={handleTimeUpdate}
            onTimeUpdate={handleTimeUpdate}
            onVolumeChange={onVolumeChange}
            playsInline={true}
            poster={poster}
            preload="metadata"
            ref={videoRef}
            width={'100%'}
          >
            <source src={src} type={srcType} />
          </video>
        </m.div>
      ) : (
        <audio
          className={audioClassName}
          controls={true}
          onEnded={onEnded}
          onError={onError}
          onLoadedData={handleLoadedData}
          onLoadedMetadata={handleLoadedMetaData}
          onPause={onPause}
          onPlay={onPlay}
          onPlaying={onPlaying}
          onSeeking={handleTimeUpdate}
          onTimeUpdate={handleTimeUpdate}
          onVolumeChange={onVolumeChange}
          preload="metadata"
          ref={audioRef}
          src={src}
        />
      )}
      <div className={mediaBase}>
        <label htmlFor={id} className={labelLayout}>
          <Typography
            as="span"
            size="paragraph"
            className={timeLabel}
            shouldUseCapsize={false}
          >
            {duration === 0 ? '...' : secondsToFormattedTime(currentTime)}
          </Typography>
          {title && isTitleVisible ? (
            <Typography
              as="h4"
              size="paragraph"
              className={timeLabelCenter}
              whitespace="ellipsis"
              shouldUseCapsize={false}
            >
              {title}
            </Typography>
          ) : null}
          <Typography
            as="span"
            size="paragraph"
            className={timeLabelRight}
            shouldUseCapsize={false}
          >
            {duration === 0
              ? '...'
              : secondsToFormattedTime(
                  Math.floor(duration) - Math.floor(currentTime)
                )}
          </Typography>
        </label>
        <Range
          id={id}
          onChange={handleMediaRangeChange}
          variant="audio"
          min={0}
          max={duration}
          step={1}
          value={currentTime}
        />
      </div>
    </>
  );
};
