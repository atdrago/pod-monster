import { NextRequest, NextResponse } from 'next/server';
import type { Chapter, PodcastIndexChapterResponse } from 'types';
import { notNullOrUndefined } from 'utils/notNullOrUndefined';

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function GET(
  request: NextRequest,
): Promise<NextResponse<Array<Chapter> | { error: unknown }>> {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: '`url` is required' }, { status: 400 });
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

    const chaptersSorted = chapters
      .filter((chapter): chapter is Chapter =>
        notNullOrUndefined(chapter.startTime),
      )
      .sort((chapterA, chapterB) => chapterA.startTime - chapterB.startTime);

    return NextResponse.json(chaptersSorted, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=3600',
      },
      status: 200,
    });
  } catch (err) {
    return NextResponse.json({ error: err }, { status: 500 });
  }
}
