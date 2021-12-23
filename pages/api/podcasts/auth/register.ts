import type { NextApiHandler } from 'next';

import { getAuthValues } from '@atdrago/podcast-index';
import { logger } from 'utils/logger';

const handler: NextApiHandler = (_req, res) => {
  logger.warn('Register called heloooooooo');
  // eslint-disable-next-line no-console
  console.log('Register called heloooooooo');

  res
    .status(200)
    .json(
      getAuthValues(
        process.env.NEXT_PUBLIC_PODCAST_INDEX_API_KEY,
        process.env.NEXT_PUBLIC_PODCAST_INDEX_API_SECRET
      )
    );
};

export default handler;
