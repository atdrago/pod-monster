import type { NextApiHandler } from 'next';
import SrtParser from 'srt-parser-2';

import type { ITranscriptItem, TranscriptDocument } from 'types';
import { formattedTimeToSeconds } from 'utils/date';

const handler: NextApiHandler = async (req, res) => {
  const url = typeof req.query.url === 'string' ? req.query.url : null;
  const type = typeof req.query.type === 'string' ? req.query.type : null;

  if (!url) {
    return res.status(400).json({ error: '`url` is required' });
  }

  if (!type) {
    return res.status(400).json({ error: '`type` is required' });
  }

  if (type !== 'application/srt') {
    return res
      .status(501)
      .json({ error: 'Only SRT transcripts are currently supported' });
  }

  try {
    const transcriptResponse = await fetch(url, {
      method: 'GET',
    });

    if (!transcriptResponse.ok) {
      throw new Error(
        `Failed to get transcript: ${transcriptResponse.statusText}`
      );
    }

    const transcriptFile = await transcriptResponse.text();
    const srtParser = new SrtParser();

    const transcriptDocument: TranscriptDocument = srtParser
      .fromSrt(transcriptFile)
      .map((item) => {
        const transcriptItem: ITranscriptItem = {
          ...item,
          endTimeSeconds: formattedTimeToSeconds(item.endTime),
          startTimeSeconds: formattedTimeToSeconds(item.startTime),
        };

        return transcriptItem;
      });

    return res
      .setHeader(
        'Cache-Control',
        'public, s-maxage=60, stale-while-revalidate=3600'
      )
      .status(200)
      .json(transcriptDocument);
  } catch (err) {
    return res
      .status(500)
      .json({ error: `An error occurred processing the transcript: ${err}` });
  }
};

export default handler;
