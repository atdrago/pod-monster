import { request } from 'utils/request';
import type { FeedSettings } from 'contexts/SettingsContext';

export type OpmlImportResponse = {
  errors: Array<{ title: string }>;
  feedSettings: FeedSettings;
};

export const fetchOpmlImport = async (
  opmlFile: File,
): Promise<OpmlImportResponse> => {
  const opmlImportProxyUrl = new URL(
    '/api/settings/opml/import',
    process.env.NEXT_PUBLIC_BASE_URL,
  );

  const body = new FormData();
  body.append('opml', opmlFile);

  return await request<OpmlImportResponse>(opmlImportProxyUrl.toString(), {
    body,
    method: 'POST',
  });
};
