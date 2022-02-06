import type { NextApiHandler } from 'next';

import { createApiErrorResponse } from 'utils/createApiErrorResponse';

const handler: NextApiHandler = async (req, res) => {
  let image;

  try {
    if (typeof req.query.url === 'string') {
      image = await fetch(req.query.url);
    }
  } catch (err) {
    return res.status(400).send(createApiErrorResponse(err));
  }

  if (!image || image?.status !== 200) {
    return res
      .status(400)
      .send(createApiErrorResponse('Could not fetch image.'));
  }

  res
    .setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    .status(200)
    .send(image.body);
};

export default handler;
