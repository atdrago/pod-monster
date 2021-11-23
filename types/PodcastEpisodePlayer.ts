import type { ApiResponse } from 'podcastdx-client/src/types';

import type { IChapter, TranscriptDocument } from 'types';

export interface IPodcastEpisodePlayerProps {
  chapters: Array<IChapter> | null;
  episode: ApiResponse.EpisodeById['episode'];
  startTime?: number;
  transcript?: TranscriptDocument | null;
}
