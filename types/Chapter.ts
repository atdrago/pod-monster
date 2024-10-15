export interface PodcastIndexChapterResponse {
  chapters: Array<PodcastIndexChapter>;
}

export interface PodcastIndexChapter {
  img?: string | null;
  startTime?: number | null;
  title?: string | null;
  toc?: boolean | null;
  url?: string | null;
}

export interface Chapter {
  img?: string | null;
  startTime: number;
  title?: string | null;
  toc?: boolean | null;
  url?: string | null;
}
