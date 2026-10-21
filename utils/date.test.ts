import { secondsToShortClockTime } from './date';

describe('date', () => {
  describe('secondsToShortClockTime', () => {
    it.each([
      [0, '0:00'],
      [5, '0:05'],
      [90, '1:30'],
      [754, '12:34'],
      [3599, '59:59'],
      [3600, '1:00:00'],
      [3723, '1:02:03'],
      [36_000, '10:00:00'],
    ])('should format %d seconds as %s', (seconds, expectedText) => {
      expect(secondsToShortClockTime(seconds)).toBe(expectedText);
    });

    it('should floor a decimal time', () => {
      expect(secondsToShortClockTime(90.9)).toBe('1:30');
    });
  });
});
