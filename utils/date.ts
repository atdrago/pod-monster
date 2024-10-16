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
  { includeMilliseconds = false }: { includeMilliseconds?: boolean } = {},
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
    ]
      .filter(notNullOrUndefined)
      .join(':') +
    (includeMilliseconds ? '.' + `${milliseconds}`.padStart(3, '0') : '')
  );
};
