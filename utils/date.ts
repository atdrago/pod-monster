import { notNullOrUndefined } from 'utils/notNullOrUndefined';

/**
 * @example "October 7, 2021 at 4:14 PM"
 */
export const noteDateTimeFormat = new Intl.DateTimeFormat('default', {
  dateStyle: 'long',
  timeStyle: 'short',
});

/**
 * @example "10/10/2021"
 */
export const shortDateFormat = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'numeric',
  year: 'numeric',
});

const getPaddedMonth = (date: Date): string => {
  // Get the 1-indexed month and add a 0 if it is only 1 digit
  return `${date.getMonth() + 1}`.replace(/^(\d)$/, '0$1');
};

const getPaddedDayOfTheMonth = (date: Date): string => {
  // Get the day of the month, and add a 0 if it is only 1 digit
  return `${date.getDate()}`.replace(/^(\d)$/, '0$1');
};

const getPaddedHour = (date: Date): string => {
  // Get the hour, and add a 0 if it is only 1 digit
  return `${date.getHours()}`.replace(/^(\d)$/, '0$1');
};

const getPaddedMinute = (date: Date): string => {
  // Get the hour, and add a 0 if it is only 1 digit
  return `${date.getMinutes()}`.replace(/^(\d)$/, '0$1');
};

export const dateInputFormat = {
  format: (date: Date): string => {
    const month = getPaddedMonth(date);
    const dayOfTheMonth = getPaddedDayOfTheMonth(date);
    const year = date.getFullYear();

    return `${year}-${month}-${dayOfTheMonth}`;
  },
};

export const timeInputFormat = {
  format: (date: Date): string => {
    const hour = getPaddedHour(date);
    const minute = getPaddedMinute(date);

    return `${hour}:${minute}`;
  },
};

export const dateAndTimeToJson = (
  date = '1970-01-01',
  time = '00:00'
): string => {
  return new Date(`${date}T${time}`).toJSON();
};

export const secondsToFormattedTime = (
  seconds: number,
  { includeMilliseconds = false }: { includeMilliseconds?: boolean } = {}
): string => {
  if (seconds === 0) {
    return '00:00:00';
  }

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

  return [
    days ? days : null,
    `${hours}`.padStart(2, '0'),
    `${minutes}`.padStart(2, '0'),
    `${second}`.padStart(2, '0'),
    includeMilliseconds ? `${milliseconds}`.padStart(3, '0') : null,
  ]
    .filter(notNullOrUndefined)
    .join(':');
};

export const secondsToUrlEncodableTime = (seconds: number): string => {
  return secondsToFormattedTime(seconds, { includeMilliseconds: true }).replace(
    /:/g,
    '-'
  );
};

export const urlEncodableTimeToSeconds = (time: string): number => {
  time = time.trim();

  let seconds = 0;

  time
    .split('-')
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

  return seconds;
};
