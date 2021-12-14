import type { FeedSettings } from 'types';

export type OpmlImportResponse = {
  errors: Array<{ reason: unknown; title: string }>;
  feedSettings: FeedSettings;
};
