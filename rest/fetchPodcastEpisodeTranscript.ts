import type { PIApiEpisodeDetail } from 'podcastdx-client/src/types';

import type { TranscriptDocument } from 'types';
import { logger } from 'utils/logger';
import { notNullOrUndefined } from 'utils/notNullOrUndefined';
import { request } from 'utils/request';

/**
 * Transcript types supported by the API. This list should be sorted from the
 * most feature-rich and most performant transcript experiences to the least.
 */
export const supportedTranscriptTypes = [
  'text/vtt',
  'application/srt',
  'text/html',
];

export const fetchPodcastEpisodeTranscript = async (
  transcripts: PIApiEpisodeDetail['transcripts'],
  duration: number
): Promise<TranscriptDocument> => {
  if (!transcripts) {
    throw new Error('`transcripts` is required');
  }

  const sortedTranscripts = supportedTranscriptTypes
    .map((supportedType) =>
      transcripts.find(({ type }) => type === supportedType)
    )
    .filter(notNullOrUndefined);

  const targetTranscript = sortedTranscripts[0];

  if (!targetTranscript) {
    const requestedTranscriptTypes = transcripts
      .map(({ type }) => `"${type}"`)
      .join(', ');

    const message = `None of the requested transcript types are supported: ${requestedTranscriptTypes}`;

    logger.info(message);

    throw new Error(message);
  }

  const transcriptProxyUrl = new URL(
    '/api/podcasts/transcript',
    process.env.NEXT_PUBLIC_BASE_URL
  );

  transcriptProxyUrl.searchParams.set('type', targetTranscript.type);
  transcriptProxyUrl.searchParams.set('url', targetTranscript.url);
  transcriptProxyUrl.searchParams.set('duration', `${duration}`);

  return await request(transcriptProxyUrl.toString(), {
    method: 'GET',
  });
};
