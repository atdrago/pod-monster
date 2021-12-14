import type { OpmlImportResponse } from 'types';

export const fetchOpmlV3ToV4 = async (
  ids: Array<string>
): Promise<OpmlImportResponse | null> => {
  try {
    const opmlV3ToV4Url = new URL(
      '/api/settings/opml/migrate-v3-to-v4',
      process.env.NEXT_PUBLIC_BASE_URL
    );

    opmlV3ToV4Url.searchParams.set('ids', ids.join(','));

    const opmlV3ToV4Response = await fetch(opmlV3ToV4Url.toString(), {
      method: 'GET',
    });

    if (!opmlV3ToV4Response.ok) {
      throw new Error('no k');
    }

    return await opmlV3ToV4Response.json();
  } catch (err) {
    // TODO: Capture exception

    return null;
  }
};
