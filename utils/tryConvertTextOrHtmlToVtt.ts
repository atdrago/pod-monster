import rehypeParse from 'rehype-parse';
import rehypeStripHtml from 'rehype-strip-html';
import { unified } from 'unified';

import { secondsToFormattedTime } from './date';

export async function tryConvertTextOrHtmlToVtt(
  textOrHtml: string,
  podcastDurationSeconds: number
): Promise<string | undefined> {
  // Strip HTML
  const rawText = String(
    await unified().use(rehypeParse).use(rehypeStripHtml).process(textOrHtml)
  );

  // Get start/end indexes of bracket-style timestamps (ex. [00:00:00] or [00:00:00.000])
  const timestampRegExp = /\[\d{2}:\d{2}:\d{2}(.\d{3})?\]/gm;
  let match;
  const timestampMatches = [];

  while ((match = timestampRegExp.exec(rawText)) !== null) {
    timestampMatches.push({
      end: timestampRegExp.lastIndex,
      start: match.index,
    });
  }

  if (timestampMatches.length === 0) {
    return undefined;
  }

  // Build up list of cues
  const cues = [];

  for (let i = 0; i < timestampMatches.length; i++) {
    const timestampMatch = timestampMatches[i];
    const nextTimestampMatch = timestampMatches[i + 1];

    const timestamp = rawText.substring(
      timestampMatch.start,
      timestampMatch.end
    );
    const text = rawText
      .substring(timestampMatch.end, nextTimestampMatch?.start)
      .trim();

    // Don't add cue if no text
    if (text === '') {
      continue;
    }

    const nextTimestamp = nextTimestampMatch
      ? rawText.substring(nextTimestampMatch.start, nextTimestampMatch.end)
      : undefined;

    cues.push({
      end: nextTimestamp
        ? timestampToFormattedTime(nextTimestamp)
        : secondsToFormattedTime(podcastDurationSeconds, {
            includeMilliseconds: true,
          }),
      start: timestampToFormattedTime(timestamp),
      text,
    });
  }

  // Make VTT file
  const vtt = [
    'WEBVTT',
    ...cues.map((c) => `${c.start} --> ${c.end}\n${c.text}`),
    '', // Important we end with \n\n
  ].join('\n\n');

  return vtt;
}

function timestampToFormattedTime(timestamp: string): string {
  // Remove brackets
  let cueTiming = timestamp.substring(1, timestamp.length - 1);

  // Add milliseconds if necessary
  if (!/\d{2}:\d{2}:\d{2}.\d{3}/.test(cueTiming)) {
    cueTiming = `${cueTiming}.000`;
  }

  return cueTiming;
}
