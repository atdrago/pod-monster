import type { IApiErrorResponse, OpmlImportResponse } from 'types';
import { createApiErrorResponse } from 'utils/createApiErrorResponse';

export const fetchOpmlImport = async (
  opmlFile: File
): Promise<OpmlImportResponse | IApiErrorResponse> => {
  try {
    const opmlImportProxyUrl = new URL(
      '/api/settings/opml/import',
      process.env.NEXT_PUBLIC_BASE_URL
    );

    const body = new FormData();
    body.append('opml', opmlFile);

    const opmlImportResponse = await fetch(opmlImportProxyUrl.toString(), {
      body,
      method: 'POST',
    });

    if (!opmlImportResponse.ok) {
      throw new Error(opmlImportResponse.statusText);
    }

    return await opmlImportResponse.json();
  } catch (err) {
    return createApiErrorResponse(err);
  }
};
