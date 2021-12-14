import type { FeedSettings } from 'types';

export type OpmlImportResponse = {
  errors: Array<{ title: string }>;
  feedSettings: FeedSettings;
};
