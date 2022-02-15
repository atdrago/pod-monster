import type { NextApiHandler } from 'next';

import { createApiErrorResponse } from 'utils/createApiErrorResponse';
import { logger } from 'utils/logger';

const handler: NextApiHandler = async (req, res) => {
  const url = typeof req.query.url === 'string' ? req.query.url : null;

  if (!url) {
    return res.status(400).json(createApiErrorResponse('`url` is required'));
  }

  try {
    const imageResponse = await fetch(url);

    if (!imageResponse.ok) {
      logger.error(`Could not fetch image: ${imageResponse.statusText}.`);

      return res
        .status(400)
        .send(
          createApiErrorResponse(
            `Could not fetch image: ${imageResponse.statusText}.`
          )
        );
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
