export interface IPodcastIndexChapterResponse {
  chapters: Array<IPodcastIndexChapter>;
}

export interface IPodcastIndexChapter {
  img?: string | null;
  startTime?: number | null;
  title?: string | null;
  toc?: boolean | null;
  url?: string | null;
}

export interface IChapter {
  img?: string | null;
  startTime: number;
  title?: string | null;
  toc?: boolean | null;
  url?: string | null;
}
