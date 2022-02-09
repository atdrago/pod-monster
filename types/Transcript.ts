export interface ISrtTranscriptItem {
  endTime: string;
  endTimeSeconds?: number;
  id: string;
  startTime: string;
  startTimeSeconds?: number;
  text: string;
}

export interface ITextTranscriptDocument {
  text: string;
}

export type TranscriptDocument =
  | {
      content: Array<ISrtTranscriptItem>;
      type: 'application/srt';
    }
  | {
      content: ITextTranscriptDocument;
      type: 'text/html';
    };
