import type { NextApiHandler } from 'next';

import { createApiErrorResponse } from 'utils/createApiErrorResponse';
import imageDomains from 'utils/imageDomains';
import { logger } from 'utils/logger';

const handler: NextApiHandler = async (req, res) => {
  const url = typeof req.query.url === 'string' ? req.query.url : null;

  if (!url) {
    return res.status(400).json(createApiErrorResponse('`url` is required'));
  }

  try {
    const imageResponse = await fetch(url);

    if (!imageResponse.ok) {
      const errorMessage = `Could not fetch image from "${url}": ${imageResponse.statusText}.`;

      logger.error(errorMessage);

      return res.status(400).send(createApiErrorResponse(errorMessage));
    }

    const { hostname } = new URL(url);

    if (!imageDomains.includes(hostname)) {
      logger.info(`Unknown hostname encountered: "${hostname}"`);
    }

    return res
      .setHeader('Cache-Control', 'public, max-age=31536000, immutable')
      .status(200)
      .send(imageResponse.body);
  } catch (err) {
    return res.status(400).send(createApiErrorResponse(err));
  }
};

export default handler;
