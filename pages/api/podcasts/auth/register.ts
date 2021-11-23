import { NextApiHandler } from 'next';

import { getAuthValues } from 'utils/podcastIndex/getAuthValues';

const handler: NextApiHandler = (req, res) => {
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
