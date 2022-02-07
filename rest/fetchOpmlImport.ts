import type { OpmlImportResponse } from 'types';
import { request } from 'utils/request';

export const fetchOpmlImport = async (
  opmlFile: File
): Promise<OpmlImportResponse> => {
  const opmlImportProxyUrl = new URL(
    '/api/settings/opml/import',
    process.env.NEXT_PUBLIC_BASE_URL
  );

  const body = new FormData();
  body.append('opml', opmlFile);

  return await request<OpmlImportResponse>(opmlImportProxyUrl.toString(), {
    body,
    method: 'POST',
  });
};
