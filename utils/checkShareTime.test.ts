import { parseTimecode } from 'utils/parseTimecode';

import { checkShareTime } from './checkShareTime';

describe('checkShareTime', () => {
  it('should accept a time before a known end', () => {
    expect(checkShareTime(1799, 1800)).toEqual({
      isValid: true,
      seconds: 1799,
    });
  });

  it('should reject a time after a known end', () => {
    expect(checkShareTime(parseTimecode('45:00'), 1800)).toEqual({
      isValid: false,
      reason: 'atOrAfterEnd',
    });
  });

  it('should reject a time at a known end', () => {
    expect(checkShareTime(1800, 1800)).toEqual({
      isValid: false,
      reason: 'atOrAfterEnd',
    });
  });

  it('should accept a time under 24 hours when the length is not known', () => {
    expect(checkShareTime(86_399)).toEqual({ isValid: true, seconds: 86_399 });
    expect(checkShareTime(86_399, undefined)).toEqual({
      isValid: true,
      seconds: 86_399,
    });
  });

  it('should reject a time of 24 hours or more when the length is not known', () => {
    expect(checkShareTime(86_400)).toEqual({
      isValid: false,
      reason: 'overLimit',
    });
  });

  it('should reject a time of 24 hours or more when the known length is longer', () => {
    expect(checkShareTime(90_000, 100_000)).toEqual({
      isValid: false,
      reason: 'overLimit',
    });
  });

  it('should reject 0 and a negative time', () => {
    expect(checkShareTime(0, 1800)).toEqual({
      isValid: false,
      reason: 'notAfterStart',
    });
    expect(checkShareTime(-5)).toEqual({
      isValid: false,
      reason: 'notAfterStart',
    });
  });

  it('should floor a decimal time before the checks', () => {
    expect(checkShareTime(754.9)).toEqual({ isValid: true, seconds: 754 });
    expect(checkShareTime(0.5)).toEqual({
      isValid: false,
      reason: 'notAfterStart',
    });
    expect(checkShareTime(1799.9, 1800)).toEqual({
      isValid: true,
      seconds: 1799,
    });
  });

  it('should reject text that does not parse as a time', () => {
    expect(checkShareTime(parseTimecode('five minutes'))).toEqual({
      isValid: false,
      reason: 'unreadable',
    });
    expect(checkShareTime(Number.NaN)).toEqual({
      isValid: false,
      reason: 'unreadable',
    });
    expect(checkShareTime(Number.POSITIVE_INFINITY)).toEqual({
      isValid: false,
      reason: 'unreadable',
    });
  });

  it.each([0, -1, Number.NaN, null])(
    'should treat a known length of %p as no known length',
    (knownLengthSeconds) => {
      expect(checkShareTime(2700, knownLengthSeconds)).toEqual({
        isValid: true,
        seconds: 2700,
      });
    },
  );
});
