import type { PIApiEpisodeDetail } from 'podcastdx-client/src/types';

import type { TranscriptDocument } from 'types';
import { request } from 'utils/request';

export const fetchPodcastEpisodeTranscript = async (
  transcripts: PIApiEpisodeDetail['transcripts']
): Promise<TranscriptDocument> => {
  if (!transcripts) {
    throw new Error('`transcripts` is required');
  }

  const srtTranscript = transcripts.find(
    ({ type }) => type === 'application/srt'
  );

  if (!srtTranscript) {
    throw new Error('Only SRT transcripts are currently supported');
  }

  const transcriptProxyUrl = new URL(
    '/api/podcasts/transcript',
    process.env.NEXT_PUBLIC_BASE_URL
  );

  transcriptProxyUrl.searchParams.set('type', srtTranscript.type);
  transcriptProxyUrl.searchParams.set('url', srtTranscript.url);

  return await request(transcriptProxyUrl.toString(), {
    method: 'GET',
  });
};
