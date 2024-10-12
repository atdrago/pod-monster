import { parse } from '@plussub/srt-vtt-parser';
import type { NextApiHandler } from 'next';
import ReactDomServer from 'react-dom/server';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';

import { HtmlViewer } from 'components/molecules/HtmlViewer';
import { supportedTranscriptTypes } from 'rest/fetchPodcastEpisodeTranscript';
import type {
  IApiErrorResponse,
  ITranscriptItem,
  TranscriptDocument,
} from 'types';
import { createApiErrorResponse } from 'utils/createApiErrorResponse';
import { tryConvertTextOrHtmlToVtt } from 'utils/tryConvertTextOrHtmlToVtt';

const handler: NextApiHandler<TranscriptDocument | IApiErrorResponse> = async (
  req,
  res
) => {
  const url = typeof req.query.url === 'string' ? req.query.url : null;
  let type = typeof req.query.type === 'string' ? req.query.type : null;
  const duration =
    typeof req.query.duration === 'string'
      ? parseFloat(req.query.duration)
      : null;

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

    let transcriptResponseText = await transcriptResponse.text();

    if (type === 'text/html') {
      const vtt = await tryConvertTextOrHtmlToVtt(
        transcriptResponseText,
        duration
      );

      if (vtt) {
        type = 'text/vtt';
        transcriptResponseText = vtt;
      }
    }

    switch (type) {
      case 'application/srt':
      case 'text/vtt': {
        const entries = parse(transcriptResponseText).entries.map(
          ({ from, id, text, to }): ITranscriptItem => ({
            // Convert from ms to seconds
            from: from / 1000,
            id,
            text,
            to: to / 1000,
          })
        );

        return res
          .setHeader(
            'Cache-Control',
            'public, s-maxage=60, stale-while-revalidate=3600'
          )
          .status(200)
          .json({
            content: entries,
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
  } catch {
    return res.status(500).json(createApiErrorResponse(res));
  }
};

export default handler;
