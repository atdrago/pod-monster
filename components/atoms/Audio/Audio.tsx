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
  onCurrentTimeChange = () => ({}),
  onLoadedData = () => ({}),
  onLoadedMetadata = () => ({}),
  startTime = 0,
  title,
  isTitleVisible = true,
  ...audioProps
}) {
  const rootClassName = useClassNames(audio, className);
  const [duration, setDuration] = useState(0);
  const id = useUniqueId();

  const handleTimeUpdate: ReactEventHandler<HTMLAudioElement> = (event) => {
    onCurrentTimeChange(event.currentTarget.currentTime);
  };

  const handleLoadedMetaData: ReactEventHandler<HTMLAudioElement> = (event) => {
    if (audioRef.current) {
      // After the audio file loads, set its currentTime to the `start` query
      // string parameter. This must be done after the audio file has loaded,
      // and fixes an iOS-specific bug, as opposed to setting the currentTime
      // immediately when the page mounts.
      audioRef.current.currentTime = startTime;
    }

    setDuration(event.currentTarget.duration);

    onLoadedMetadata(event);
  };

  const handleLoadedData: ReactEventHandler<HTMLAudioElement> = (event) => {
    if (audioRef.current) {
      // After the audio file loads, set its currentTime to the `start` query
      // string parameter. This must be done after the audio file has loaded,
      // and fixes an iOS-specific bug, as opposed to setting the currentTime
      // immediately when the page mounts.
      audioRef.current.currentTime = startTime;
    }

    onLoadedData(event);
  };

  const handleAudioRangeChange: ReactEventHandler<HTMLInputElement> = (
    event
  ) => {
    if (audioRef.current) {
      audioRef.current.currentTime = event.currentTarget.valueAsNumber;
    }

    onCurrentTimeChange(event.currentTarget.valueAsNumber);
  };

  /**
   * Update the duration string if the audio element's `duration` property
   * changes
   */
  useEffect(() => {
    // If `onLoadedMetadata` doesn't fire, this will set the duration for us
    const nextDuration = audioRef.current?.duration ?? 0;
    // Sometimes it's NaN...
    setDuration(isNaN(nextDuration) ? 0 : nextDuration);
  }, [audioRef, audioRef.current?.duration]);

  /**
   * As a back-up to on the onLoad* events, set the audio element's
   * `currentTime` property to the `start` query parameter.
   */
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = startTime;
    }
    // We only want to set the current time when the component mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={audioBase}>
      <audio
        className={rootClassName}
        controls={true}
        onLoadedData={handleLoadedData}
        onLoadedMetadata={handleLoadedMetaData}
        onSeeking={handleTimeUpdate}
        onTimeUpdate={handleTimeUpdate}
        ref={audioRef}
        {...audioProps}
      />
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
  );
};
