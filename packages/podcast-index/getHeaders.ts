import type { PodcastIndexConfig } from './types';

export const getHeaders = (
  config: PodcastIndexConfig,
): Record<string, string> => {
  const { apiKey, authTime, authToken, userAgent } = config;

  return {
    Authorization: authToken,
    'User-Agent': userAgent,
    'X-Auth-Date': `${authTime}`,
    'X-Auth-Key': apiKey,
  };
};
