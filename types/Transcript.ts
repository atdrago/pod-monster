import { parse } from '@plussub/srt-vtt-parser';

type SrtVttParserEntryItem = ReturnType<typeof parse>['entries'][0];

export interface ITranscriptItem extends SrtVttParserEntryItem {
  from: number;
  id: string;
  text: string;
  to: number;
}

export type TranscriptDocument =
  | {
      content: Array<ITranscriptItem>;
      type: 'application/srt';
    }
  | {
      content: Array<ITranscriptItem>;
      type: 'text/vtt';
    }
  | {
      content: string;
      type: 'text/html';
    };
