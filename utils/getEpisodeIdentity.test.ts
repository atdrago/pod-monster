import { getEpisodeIdentity } from './getEpisodeIdentity';

const ENCLOSURE_URL = 'https://example.com/Episode-1.mp3';

describe('getEpisodeIdentity', () => {
  it('should give the trimmed guid, with no change of case', () => {
    expect(getEpisodeIdentity('  Guid-ABC \n', ENCLOSURE_URL)).toBe('Guid-ABC');
  });

  it('should give the trimmed enclosure URL when the guid is empty or only whitespace', () => {
    expect(getEpisodeIdentity('', ` ${ENCLOSURE_URL} `)).toBe(ENCLOSURE_URL);
    expect(getEpisodeIdentity(' \t ', ENCLOSURE_URL)).toBe(ENCLOSURE_URL);
  });

  it('should give the enclosure URL when the guid is not a string', () => {
    expect(getEpisodeIdentity(undefined, ENCLOSURE_URL)).toBe(ENCLOSURE_URL);
    expect(getEpisodeIdentity(null, ENCLOSURE_URL)).toBe(ENCLOSURE_URL);
    expect(getEpisodeIdentity(42, ENCLOSURE_URL)).toBe(ENCLOSURE_URL);
  });

  it('should give undefined when neither value gives an identity', () => {
    expect(getEpisodeIdentity(undefined, undefined)).toBeUndefined();
    expect(getEpisodeIdentity(' ', ' ')).toBeUndefined();
    expect(getEpisodeIdentity(null, 42)).toBeUndefined();
  });
});
