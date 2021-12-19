import type { IPodcastIndexConfig } from '@atdrago/podcast-index';

export const getPodcastIndexConfig = (
  authTime: string,
  authToken: string
): IPodcastIndexConfig => {
  return {
    apiKey: process.env.NEXT_PUBLIC_PODCAST_INDEX_API_KEY,
    authTime,
    authToken,
    // TODO: Proper version reporting
    userAgent: `${process.env.NEXT_PUBLIC_APP_NAME}/0.1`,
  };
};
