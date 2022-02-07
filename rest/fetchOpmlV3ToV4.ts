import type { OpmlImportResponse } from 'types';
import { request } from 'utils/request';

export const fetchOpmlV3ToV4 = async (
  ids: Array<string>
): Promise<OpmlImportResponse> => {
  const opmlV3ToV4Url = new URL(
    '/api/settings/opml/migrate-v3-to-v4',
    process.env.NEXT_PUBLIC_BASE_URL
  );

  opmlV3ToV4Url.searchParams.set('ids', ids.join(','));

  return await request<OpmlImportResponse>(opmlV3ToV4Url.toString(), {
    method: 'GET',
  });
};
