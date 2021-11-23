import { IPodcastIndexConfig } from 'utils/podcastIndex';

export const getPodcastIndexConfig = (
  authTime: string,
  authToken: string
): IPodcastIndexConfig => {
  return {
    apiKey: process.env.NEXT_PUBLIC_PODCAST_INDEX_API_KEY,
    authTime,
    authToken,
    userAgent: 'podcast.fish/0.1',
  };
};
