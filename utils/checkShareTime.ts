// The limit is exclusive, and it is the same as the limit of the app.
const SHARE_TIME_LIMIT_SECONDS = 86_400;

type ShareTimeProblem =
  | 'atOrAfterEnd'
  | 'notAfterStart'
  | 'overLimit'
  | 'unreadable';

type ShareTimeCheck =
  | { isValid: true; seconds: number }
  | { isValid: false; reason: ShareTimeProblem };

/**
 * The time rule for the `t` of a share link. It is the same as `checkShareTime` of the native
 * app, so a link gives the same prompt on the site and in the app. Parse the text with
 * `parseTimecode` first, then pass its result here. The function floors the time. A valid time is
 * more than 0, before a known end, and less than 24 hours.
 *
 * A known length that is not more than 0 counts as no known length, because a player reports 0
 * before it loads the media.
 */
export function checkShareTime(
  seconds: number | null,
  knownLengthSeconds?: number | null,
): ShareTimeCheck {
  if (seconds === null || !Number.isFinite(seconds)) {
    return { isValid: false, reason: 'unreadable' };
  }

  const wholeSeconds = Math.floor(seconds);

  if (wholeSeconds <= 0) {
    return { isValid: false, reason: 'notAfterStart' };
  }

  if (
    knownLengthSeconds !== null &&
    knownLengthSeconds !== undefined &&
    Number.isFinite(knownLengthSeconds) &&
    knownLengthSeconds > 0 &&
    wholeSeconds >= knownLengthSeconds
  ) {
    return { isValid: false, reason: 'atOrAfterEnd' };
  }

  if (wholeSeconds >= SHARE_TIME_LIMIT_SECONDS) {
    return { isValid: false, reason: 'overLimit' };
  }

  return { isValid: true, seconds: wholeSeconds };
}
