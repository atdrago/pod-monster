import type { NextApiHandler } from 'next';

import type {
  ApiErrorResponse,
  Chapter,
  PodcastIndexChapterResponse,
} from 'types';
import { createApiErrorResponse } from 'utils/createApiErrorResponse';
import { notNullOrUndefined } from 'utils/notNullOrUndefined';

const handler: NextApiHandler<Array<Chapter> | ApiErrorResponse> = async (
  req,
  res,
) => {
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

    const { chapters }: PodcastIndexChapterResponse =
      await chaptersResponse.json();

    const chaptersSorted: Array<Chapter> = chapters
      .filter((chapter): chapter is Chapter =>
        notNullOrUndefined(chapter.startTime),
      )
      .sort((chapterA, chapterB) => chapterA.startTime - chapterB.startTime);

    return res
      .setHeader(
        'Cache-Control',
        'public, s-maxage=60, stale-while-revalidate=3600',
      )
      .status(200)
      .json(chaptersSorted);
  } catch (err) {
    return res.status(500).json(createApiErrorResponse(err));
  }
};

export default handler;
