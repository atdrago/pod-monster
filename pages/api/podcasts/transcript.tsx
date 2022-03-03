import { parse } from '@plussub/srt-vtt-parser';
import type { NextApiHandler } from 'next';
import ReactDomServer from 'react-dom/server';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';

import { HtmlViewer } from 'components/molecules/HtmlViewer';
import { supportedTranscriptTypes } from 'rest/fetchPodcastEpisodeTranscript';
import type { ITranscriptItem } from 'types';
import { createApiErrorResponse } from 'utils/createApiErrorResponse';

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
        `Failed to fetch transcript: ${transcriptResponse.statusText}`
      );
    }

    const transcriptResponseText = await transcriptResponse.text();

    switch (type) {
      case 'application/srt':
      case 'text/vtt': {
        const entries: Array<ITranscriptItem> = parse(
          transcriptResponseText
        ).entries.map(({ from, to, ...entry }) => ({
          ...entry,
          // Convert from ms to seconds
          from: from / 1000,
          to: to / 1000,
        }));

        return res
          .setHeader(
            'Cache-Control',
            'public, s-maxage=60, stale-while-revalidate=3600'
          )
          .status(200)
          .json({
            content: entries,
            type,
          });
      }
      case 'text/html': {
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
            type,
          });
      }
      default: {
        return res
          .status(501)
          .json(
            createApiErrorResponse(
              `The transcript type "${type}" is not supported.`
            )
          );
      }
    }
  } catch (err) {
    return res.status(500).json(createApiErrorResponse(res));
  }
};

export default handler;
