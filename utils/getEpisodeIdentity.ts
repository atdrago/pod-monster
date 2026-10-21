/**
 * The identity of an episode is its trimmed guid, else its trimmed enclosure
 * URL, with no change of case. The native app uses the same rule, so one
 * episode gets one key from either source.
 */
export const getEpisodeIdentity = (
  guid: unknown,
  enclosureUrl: unknown,
): string | undefined => {
  const trimmedGuid = typeof guid === 'string' ? guid.trim() : '';
  const trimmedEnclosureUrl =
    typeof enclosureUrl === 'string' ? enclosureUrl.trim() : '';

  return trimmedGuid || trimmedEnclosureUrl || undefined;
};
