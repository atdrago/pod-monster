export interface TranscriptItem {
  from: number;
  id: string;
  text: string;
  to: number;
}

export type TranscriptDocument = {
  content: Array<TranscriptItem> | string;
};
