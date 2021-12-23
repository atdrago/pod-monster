import { logflarePinoVercel } from '@atdrago/pino-logflare';
import Logger from 'pino';

const { send, stream } = logflarePinoVercel({
  apiKey: process.env.NEXT_PUBLIC_LOGFLARE_API_KEY,
  sourceToken: process.env.NEXT_PUBLIC_LOGFLARE_SOURCE_TOKEN,
});

export const logger = Logger(
  {
    base: {
      env: process.env.NODE_ENV,
      revision: process.env.VERCEL_GITHUB_COMMIT_SHA,
    },
    browser: {
      transmit: {
        level: 'info',
        send,
      },
    },
    level: 'debug',
  },
  stream
);
