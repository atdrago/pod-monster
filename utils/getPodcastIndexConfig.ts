import type { PodcastIndexConfig } from '@atdrago/podcast-index';

export const getPodcastIndexConfig = (
  authTime: number,
  authToken: string,
): PodcastIndexConfig => {
  return {
    apiKey: process.env.NEXT_PUBLIC_PODCAST_INDEX_API_KEY,
    authTime,
    authToken,
    userAgent: `pod.monster/${process.env.npm_package_version}`,
  };
};
