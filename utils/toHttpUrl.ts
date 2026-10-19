/**
 * The value when it is an `http:` or `https:` URL, else `undefined`.
 */
// TODO: Use `URL.parse` when every supported version of Safari has it.
export const toHttpUrl = (value: unknown): string | undefined => {
  if (typeof value !== 'string' || !URL.canParse(value)) {
    return undefined;
  }

  const { protocol } = new URL(value);

  return protocol === 'http:' || protocol === 'https:' ? value : undefined;
};
