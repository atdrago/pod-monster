import type { PIApiEpisodeDetail } from 'podcastdx-client/src/types';

import type { TranscriptDocument } from 'types';
import { notNullOrUndefined } from 'utils/notNullOrUndefined';
import { request } from 'utils/request';

/**
 * Transcript types supported by the API. This list should be sorted from the
 * _most_ feature-rich transcript experience to the _least_.
 */
export const supportedTranscriptTypes = ['application/srt', 'text/html'];

export const fetchPodcastEpisodeTranscript = async (
  transcripts: PIApiEpisodeDetail['transcripts']
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

    throw new Error(
      `None of the requested transcript types are supported: ${requestedTranscriptTypes}`
    );
  }

  const transcriptProxyUrl = new URL(
    '/api/podcasts/transcript',
    process.env.NEXT_PUBLIC_BASE_URL
  );

  transcriptProxyUrl.searchParams.set('type', targetTranscript.type);
  transcriptProxyUrl.searchParams.set('url', targetTranscript.url);

  return await request(transcriptProxyUrl.toString(), {
    method: 'GET',
  });
};
