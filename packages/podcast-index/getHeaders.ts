import { assertConfig, getConfig } from './config';
import type { IPodcastIndexConfig } from './types';

export const getHeaders = (
  config: IPodcastIndexConfig | null = getConfig()
): Record<string, string> => {
  assertConfig('getHeaders', config);

  const { apiKey, authTime, authToken, userAgent } = config;

  return {
    Authorization: authToken,
    'User-Agent': userAgent,
    'X-Auth-Date': `${authTime}`,
    'X-Auth-Key': apiKey,
  };
};
