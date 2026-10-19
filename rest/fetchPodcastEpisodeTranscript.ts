import type { PodcastEpisode } from 'types/PodcastFeed';
import { notNullOrUndefined } from 'utils/notNullOrUndefined';
import { request } from 'utils/request';

export interface TranscriptItem {
  from: number;
  id: string;
  text: string;
  to: number;
}

type TranscriptType = 'text/vtt' | 'application/srt' | 'text/html';

type Transcript = NonNullable<PodcastEpisode['transcripts']>[number];

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

/**
 * The transcript of the first supported type in `supportedTranscriptTypes`, or
 * `undefined` when the episode has no transcript of a supported type.
 */
export const getPreferredTranscript = (
  transcripts: PodcastEpisode['transcripts'] = [],
): Transcript | undefined =>
  supportedTranscriptTypes
    .map((supportedType) =>
      transcripts.find(({ type }) => type === supportedType),
    )
    .find(notNullOrUndefined);

export const fetchPodcastEpisodeTranscript = async (
  transcript: Pick<Transcript, 'type' | 'url'>,
  duration: number,
): Promise<TranscriptDocument> => {
  const transcriptProxyUrl = new URL(
    '/api/podcasts/transcript',
    process.env.NEXT_PUBLIC_BASE_URL,
  );

  transcriptProxyUrl.searchParams.set('type', transcript.type);
  transcriptProxyUrl.searchParams.set('url', transcript.url);
  transcriptProxyUrl.searchParams.set('duration', `${duration}`);

  return await request(transcriptProxyUrl.toString(), {
    method: 'GET',
  });
};
