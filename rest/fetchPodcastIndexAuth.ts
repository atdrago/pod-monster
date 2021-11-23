import { http } from 'utils/http';

export const fetchPodcastIndexAuth = async (): Promise<[string, string]> => {
  const url = new URL(
    '/api/podcasts/auth/register',
    process.env.NEXT_PUBLIC_BASE_URL
  ).toString();

  const [authTime, authToken] = await http<[string, string]>(url, {
    method: 'get',
  });

  return [authTime, authToken];
};
