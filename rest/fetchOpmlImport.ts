import type { OpmlImportResponse } from 'types';

export const fetchOpmlImport = async (
  opmlFile: File
): Promise<OpmlImportResponse | null> => {
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
      throw new Error('no k');
    }

    return await opmlImportResponse.json();
  } catch (err) {
    // TODO: Capture exception

    return null;
  }
};
