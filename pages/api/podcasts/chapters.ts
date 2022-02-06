import type { NextApiHandler } from 'next';

import type { IChapter } from 'types';
import { createApiErrorResponse } from 'utils/createApiErrorResponse';

const handler: NextApiHandler = async (req, res) => {
  const url = typeof req.query.url === 'string' ? req.query.url : null;

  if (!url) {
    return res.status(400).json(createApiErrorResponse('`url` is required'));
  }

  try {
    const chaptersResponse = await fetch(url, {
      method: 'GET',
    });

    if (!chaptersResponse.ok) {
      throw new Error(`Failed to get chapters: ${chaptersResponse.statusText}`);
    }

    const chaptersFile = await chaptersResponse.json();

    const chaptersSorted = chaptersFile.chapters.sort(
      (chapterA: IChapter, chapterB: IChapter) =>
        (chapterA?.startTime ?? 0) - (chapterB?.startTime ?? 0)
    );

    return res
      .setHeader(
        'Cache-Control',
        'public, s-maxage=60, stale-while-revalidate=3600'
      )
      .status(200)
      .json(chaptersSorted);
  } catch (err) {
    return res.status(500).json(createApiErrorResponse(err));
  }
};

export default handler;
