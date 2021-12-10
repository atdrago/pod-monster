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
import { AudioProps } from 'types';
import { secondsToFormattedTime } from 'utils/date';

import {
  audio,
  audioBase,
  labelLayout,
  timeLabel,
  timeLabelCenter,
  timeLabelRight,
} from './audio.css';

export const Audio: FunctionComponent<AudioProps> = function AudioRef({
  audioRef,
  className,
  currentTime = 0,
  isTitleVisible = true,
  isVideoVisible = true,
  onCurrentTimeChange = () => ({}),
  onLoadedData = () => ({}),
  onLoadedMetadata = () => ({}),
  poster,
  srcType,
  startTime = 0,
  title,
  videoRef,
  ...audioProps
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

    setDuration(event.currentTarget.duration);

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

    onLoadedData(event);
  };

  const handleAudioRangeChange: ReactEventHandler<HTMLInputElement> = (
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
   * Update the duration string if the audio element's `duration` property
   * changes
   */
  useEffect(() => {
    // If `onLoadedMetadata` doesn't fire, this will set the duration for us
    const nextDuration =
      audioRef.current?.duration ?? videoRef.current?.duration ?? 0;
    // Sometimes it's NaN...
    setDuration(isNaN(nextDuration) ? 0 : nextDuration);
  }, [
    audioRef,
    audioRef.current?.duration,
    videoRef,
    videoRef.current?.duration,
  ]);

  /**
   * As a back-up to on the onLoad* events, set the audio element's
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
            controls={true}
            onLoadedData={handleLoadedData}
            onLoadedMetadata={handleLoadedMetaData}
            onSeeking={handleTimeUpdate}
            onTimeUpdate={handleTimeUpdate}
            playsInline={true}
            poster={poster}
            preload="metadata"
            ref={videoRef}
            width={'100%'}
          >
            <source src={audioProps.src} type={srcType} />
          </video>
        </m.div>
      ) : (
        <audio
          className={audioClassName}
          controls={true}
          onLoadedData={handleLoadedData}
          onLoadedMetadata={handleLoadedMetaData}
          onSeeking={handleTimeUpdate}
          onTimeUpdate={handleTimeUpdate}
          ref={audioRef}
          {...audioProps}
        />
      )}
      <div className={audioBase}>
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
          onChange={handleAudioRangeChange}
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
