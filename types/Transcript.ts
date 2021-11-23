export interface ITranscriptItem {
  endTime: string;
  endTimeSeconds?: number;
  id: string;
  startTime: string;
  startTimeSeconds?: number;
  text: string;
}

export type TranscriptDocument = Array<ITranscriptItem>;

export interface ITranscriptProps {
  currentTranscriptIndex: number;
  transcript: TranscriptDocument;
}
