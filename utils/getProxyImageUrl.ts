import imageDomains from 'utils/imageDomains';
import { logger } from 'utils/logger';

export const getProxyImageUrl = (url?: string | null): string => {
  if (!url) {
    return '';
  }

  try {
    const { hostname } = new URL(url);

    if (imageDomains.includes(hostname)) {
      return url;
    }

    const proxyUrl = new URL(
      '/api/images/proxy',
      process.env.NEXT_PUBLIC_BASE_URL
    );

    proxyUrl.searchParams.set('url', url);

    return proxyUrl.toString();
  } catch (err) {
    logger.error(err);

    // TODO: Add default "not found" image and return it here.
    return '';
  }
};
