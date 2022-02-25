import type { NextApiHandler } from 'next';
import ReactDomServer from 'react-dom/server';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import SrtParser from 'srt-parser-2';

import { HtmlViewer } from 'components/molecules/HtmlViewer';
import { supportedTranscriptTypes } from 'rest/fetchPodcastEpisodeTranscript';
import type { ISrtTranscriptItem } from 'types';
import { createApiErrorResponse } from 'utils/createApiErrorResponse';
import { formattedTimeToSeconds } from 'utils/date';

const handler: NextApiHandler = async (req, res) => {
  const url = typeof req.query.url === 'string' ? req.query.url : null;
  const type = typeof req.query.type === 'string' ? req.query.type : null;

  if (!url) {
    return res.status(400).json(createApiErrorResponse('`url` is required'));
  }

  if (!type) {
    return res.status(400).json(createApiErrorResponse('`type` is required'));
  }

  if (!supportedTranscriptTypes.includes(type)) {
    return res
      .status(501)
      .json(
        createApiErrorResponse(
          `The transcript type "${type}" is not supported.`
        )
      );
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

    const transcriptResponseText = await transcriptResponse.text();

    if (type === 'application/srt') {
      const srtParser = new SrtParser();

      const transcriptSrtItems: Array<ISrtTranscriptItem> = srtParser
        .fromSrt(transcriptResponseText)
        .map((item) => {
          const transcriptItem: ISrtTranscriptItem = {
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
        .json({ content: transcriptSrtItems, type: 'application/srt' });
    } else if (type === 'text/html') {
      return res
        .setHeader(
          'Cache-Control',
          'public, s-maxage=60, stale-while-revalidate=3600'
        )
        .status(200)
        .json({
          content: ReactDomServer.renderToStaticMarkup(
            <HtmlViewer
              shouldUseCapsize={false}
              rehypePlugins={[rehypeRaw, rehypeSanitize]}
            >
              {transcriptResponseText}
            </HtmlViewer>
          ),
          type: 'text/html',
        });
    }

    return res
      .status(501)
      .json(
        createApiErrorResponse(
          `The transcript type "${type}" is not supported.`
        )
      );
  } catch (err) {
    return res.status(500).json(createApiErrorResponse(res));
  }
};

export default handler;
