import { useMemo } from 'react';

import type { Chapter } from 'types';

interface UseChapterIndexOptions {
  chapters: Array<Chapter>;
  currentTime: number;
}

export const useChapterIndex = ({
  chapters,
  currentTime,
}: UseChapterIndexOptions): number => {
  const index = useMemo(() => {
    const hasChapters = chapters && chapters.length > 0;

    if (!hasChapters) {
      return -1;
    }

    for (let i = chapters.length - 1; i >= 0; i--) {
      const { startTime } = chapters[i];

      if (startTime && currentTime >= startTime) {
        return i;
      }
    }

    return -1;
  }, [chapters, currentTime]);

  return index;
};
