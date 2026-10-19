const PLAIN_NUMBER_PATTERN = /^\d+(?:\.\d+)?$/;
const UNIT_FORM_PATTERN = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/i;

/**
 * The seconds of a time value, or `null` for a value that is not a time. The rules are the same
 * as `parseTimeValue` of the native app, so one `t` gives one time on the site and in the app.
 * The forms are:
 *
 * - a clock: `SS`, `MM:SS`, or `HH:MM:SS`
 * - the unit form: `90s`, `1m30s`, or `1h2m3s`
 * - plain seconds: `90` or `90.5`
 *
 * A Media Fragments `npt:` prefix is optional. A sign, an exponent, and a hex form are not times.
 */
export function parseTimecode(raw: string): number | null {
  let decoded: string;

  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return null;
  }

  const value = decoded.trim().replace(/^npt:/i, '');

  if (value === '') {
    return null;
  }

  if (value.includes(':')) {
    const parts = value.split(':');

    if (parts.length > 3) {
      return null;
    }

    let seconds = 0;

    for (const part of parts) {
      // An empty part is not 0. `Number('')` is 0, so `1:` or `:30` must fail here.
      if (!PLAIN_NUMBER_PATTERN.test(part)) {
        return null;
      }

      seconds = seconds * 60 + Number(part);
    }

    return seconds;
  }

  const unitMatch = UNIT_FORM_PATTERN.exec(value);

  if (unitMatch !== null) {
    const [, hours, minutes, seconds] = unitMatch;

    if (hours !== undefined || minutes !== undefined || seconds !== undefined) {
      return (
        Number(hours ?? 0) * 3600 +
        Number(minutes ?? 0) * 60 +
        Number(seconds ?? 0)
      );
    }
  }

  return PLAIN_NUMBER_PATTERN.test(value) ? Number(value) : null;
}
