import { request } from 'utils/request';

export const fetchPodcastIndexAuth = async (): Promise<[number, string]> => {
  const url = new URL(
    '/api/podcasts/auth/register',
    process.env.NEXT_PUBLIC_BASE_URL
  ).toString();

  const [authTime, authToken] = await request<[number, string]>(url, {
    method: 'get',
  });

  return [authTime, authToken];
};
