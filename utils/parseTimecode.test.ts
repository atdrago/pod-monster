import { parseTimecode } from './parseTimecode';

describe('parseTimecode', () => {
  it.each([
    ['90', 90],
    ['90.5', 90.5],
    ['12:34', 754],
    ['1:02:03', 3723],
    ['1m30s', 90],
    ['1h2m3s', 3723],
    ['npt:90', 90],
  ])('should parse %s as %d seconds', (value, expectedSeconds) => {
    expect(parseTimecode(value)).toBe(expectedSeconds);
  });

  it.each(['-5', 'abc', '1e3', '0x10', '', '1::2'])(
    'should return null for "%s"',
    (value) => {
      expect(parseTimecode(value)).toBeNull();
    },
  );

  describe('native fixtures', () => {
    it.each([
      ['0:46', 46],
      ['1:02:03', 3723],
      ['90', 90],
      ['90s', 90],
      ['1m30s', 90],
      ['1h2m3s', 3723],
      ['npt:46', 46],
      ['90.5', 90.5],
      ['1%3A02', 62],
    ])('should parse %s as %d seconds', (value, expectedSeconds) => {
      expect(parseTimecode(value)).toBe(expectedSeconds);
    });

    it.each([
      'abc',
      '',
      '   ',
      '1:2:3:4',
      ':',
      '1:',
      ':30',
      '-1',
      '1e3',
      '1E5',
      '1%',
      '%E0%A4%A',
    ])('should return null for "%s"', (value) => {
      expect(parseTimecode(value)).toBeNull();
    });
  });
});
