import { notNullOrUndefined } from 'utils/notNullOrUndefined';

/**
 * @example "October 7, 2021 at 4:14 PM"
 */
export const longDateTimeFormat = new Intl.DateTimeFormat('default', {
  dateStyle: 'long',
  timeStyle: 'short',
});

export const secondsToFormattedTime = (
  seconds: number,
  { includeMilliseconds = false }: { includeMilliseconds?: boolean } = {}
): string => {
  if (seconds === 0) {
    return '00:00:00';
  }

  const isNegative = seconds < 0;

  seconds = Math.abs(seconds);

  let milliseconds: number | null = null;

  if (includeMilliseconds) {
    milliseconds = Math.floor((seconds - Math.floor(seconds)) * 1000);
  } else {
    // If we're not including milliseconds, floor the seconds to remove decimals
    // so they don't get included in calculations, causing UI issues like start
    // and end times not aligning
    seconds = Math.floor(seconds);
  }

  const second = Math.floor(seconds % 60);
  const minutes = Math.floor((seconds / 60) % 60);
  const hours = Math.floor((seconds / (60 * 60)) % 24);
  const days = Math.floor(seconds / (60 * 60 * 24));

  return (
    (isNegative ? '-' : '') +
    [
      days ? days : null,
      `${hours}`.padStart(2, '0'),
      `${minutes}`.padStart(2, '0'),
      `${second}`.padStart(2, '0'),
      includeMilliseconds ? `${milliseconds}`.padStart(3, '0') : null,
    ]
      .filter(notNullOrUndefined)
      .join(':')
  );
};

export const formattedTimeToSeconds = (time: string): number => {
  let seconds = 0;

  time
    .trim()
    .split(/\D/)
    .reverse()
    .forEach((value, i) => {
      switch (i) {
        // milliseconds
        case 0:
          seconds += parseInt(value) / 1000;

          break;
        // seconds
        case 1:
          seconds += parseInt(value);

          break;
        // minutes
        case 2:
          seconds += parseInt(value) * 60;

          break;
        // hours
        case 3:
          seconds += parseInt(value) * 60 * 60;

          break;
        // days
        case 4:
          seconds += parseInt(value) * 60 * 60 * 24;

          break;
        default:
          // Do nothing
          break;
      }
    });

  // Round to 2 decimal places
  seconds = Math.round(seconds * 100) / 100;

  return seconds;
};
