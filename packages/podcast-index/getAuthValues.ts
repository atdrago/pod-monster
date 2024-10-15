// TODO: Uncomment the following line when we're fully migrated to the app router
// import 'server-only';

import crypto from 'crypto';

/**
 * Returns auth values based on the provided Podcast Index API Key and Secret.
 * Because this function requires the API Secret, it should not be called on the
 * client. Referencing it on the client will also add 165kB to the build because
 * of the need to polyfill the `crypto` library.
 * @param apiKey
 * @param apiSecret
 * @returns An array where the first item is auth time in seconds, and the
 * second item is auth token.
 */
export const getAuthValues = (
  apiKey: string,
  apiSecret: string,
): [number, string] => {
  const podcastIndexAuthTime = Math.floor(Date.now() / 1000);
  const podcastIndexAuthToken = crypto
    .createHash('sha1')
    .update(apiKey + apiSecret + podcastIndexAuthTime)
    .digest('hex');

  return [podcastIndexAuthTime, podcastIndexAuthToken];
};
