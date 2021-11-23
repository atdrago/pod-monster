import type { PIApiEpisodeDetail } from 'podcastdx-client/src/types';

import type { TranscriptDocument } from 'types';

export const fetchPodcastEpisodeTranscript = async (
  transcripts: PIApiEpisodeDetail['transcripts']
): Promise<TranscriptDocument | null> => {
  if (!transcripts) {
    return null;
  }

  const srtTranscript = transcripts.find(
    ({ type }) => type === 'application/srt'
  );

  if (!srtTranscript) {
    return null;
  }

  try {
    const transcriptProxyUrl = new URL(
      '/api/podcasts/transcript',
      process.env.NEXT_PUBLIC_BASE_URL
    );

    transcriptProxyUrl.searchParams.set('type', srtTranscript.type);
    transcriptProxyUrl.searchParams.set('url', srtTranscript.url);

    const transcriptResponse = await fetch(transcriptProxyUrl.toString(), {
      method: 'GET',
    });

    if (!transcriptResponse.ok) {
      throw new Error('no k');
    }

    return await transcriptResponse.json();
  } catch (err) {
    // TODO: Capture exception

    return null;
  }
};
