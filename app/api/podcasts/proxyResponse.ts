import type { SafeFetchFailureReason } from 'utils/server/safeFetchFeed';

export const GUARD_FAILURE_STATUSES: Record<SafeFetchFailureReason, number> = {
  blocked: 400,
  http_status: 502,
  network: 502,
  timeout: 504,
  too_large: 502,
};
export const PUBLIC_CACHE_CONTROL =
  'public, s-maxage=60, stale-while-revalidate=3600';
export const PRIVATE_CACHE_CONTROL = 'private, no-store';
