import { captureMessage } from '@sentry/nextjs';
import type { PIApiEpisodeDetail } from 'podcastdx-client/src/types';

import { notNullOrUndefined } from 'utils/notNullOrUndefined';
import { request } from 'utils/request';

export interface TranscriptItem {
  from: number;
  id: string;
  text: string;
  to: number;
}

type TranscriptType = 'text/vtt' | 'application/srt' | 'text/html';

export type TranscriptDocument = {
  content: Array<TranscriptItem> | string;
  type: TranscriptType;
};

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
  duration: number,
): Promise<TranscriptDocument> => {
  if (!transcripts) {
    throw new Error('`transcripts` is required');
  }

  const sortedTranscripts = supportedTranscriptTypes
    .map((supportedType) =>
      transcripts.find(({ type }) => type === supportedType),
    )
    .filter(notNullOrUndefined);

  const targetTranscript = sortedTranscripts[0];

  if (!targetTranscript) {
    const requestedTranscriptTypes = transcripts
      .map(({ type }) => `"${type}"`)
      .join(', ');

    const message = `None of the requested transcript types are supported: ${requestedTranscriptTypes}`;

    captureMessage(message);

    throw new Error(message);
  }

  const transcriptProxyUrl = new URL(
    '/api/podcasts/transcript',
    process.env.NEXT_PUBLIC_BASE_URL,
  );

  transcriptProxyUrl.searchParams.set('type', targetTranscript.type);
  transcriptProxyUrl.searchParams.set('url', targetTranscript.url);
  transcriptProxyUrl.searchParams.set('duration', `${duration}`);

  return await request(transcriptProxyUrl.toString(), {
    method: 'GET',
  });
};
