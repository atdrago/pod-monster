import { logflarePinoVercel } from '@atdrago/pino-logflare';
import pino from 'pino';

const sendToLogflare =
  !!process.env.NEXT_PUBLIC_LOGFLARE_API_KEY &&
  !!process.env.NEXT_PUBLIC_LOGFLARE_SOURCE_TOKEN;

const { send, stream } = sendToLogflare
  ? logflarePinoVercel({
      apiKey: process.env.NEXT_PUBLIC_LOGFLARE_API_KEY,
      sourceToken: process.env.NEXT_PUBLIC_LOGFLARE_SOURCE_TOKEN,
    })
  : {
      send: () => {
        // noop
      },
      stream: process.stdout,
    };

export const logger = pino(
  {
    base: {
      env: process.env.NODE_ENV,
      revision: process.env.VERCEL_GITHUB_COMMIT_SHA,
    },
    browser: {
      transmit: sendToLogflare
        ? {
            level: 'info',
            send,
          }
        : undefined,
      write: () => {
        // Prevent logs from being output to the browser console
      },
    },
    level: 'debug',
  },
  stream
);
