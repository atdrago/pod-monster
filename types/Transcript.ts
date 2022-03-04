export interface ITranscriptItem {
  from: number;
  id: string;
  text: string;
  to: number;
}

export type TranscriptDocument = {
  content: Array<ITranscriptItem> | string;
};
