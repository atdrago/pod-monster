import type { IPodcastIndexConfig } from '@atdrago/podcast-index';

export const getPodcastIndexConfig = (
  authTime: string,
  authToken: string
): IPodcastIndexConfig => {
  return {
    apiKey: process.env.NEXT_PUBLIC_PODCAST_INDEX_API_KEY,
    authTime,
    authToken,
    userAgent: `pod.monster/${process.env.npm_package_version}`,
  };
};
