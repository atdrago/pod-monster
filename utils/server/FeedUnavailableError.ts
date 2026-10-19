import 'server-only';

type FeedUnavailableReason =
  | 'http_status'
  | 'network'
  | 'timeout'
  | 'too_large';

/**
 * A transient failure of an RSS read. The error keeps only a reason code,
 * because Next.js prints each property of an uncaught server error, and a feed
 * URL can hold a private token.
 */
export class FeedUnavailableError extends Error {
  name = 'FeedUnavailableError';

  constructor(public readonly reason: FeedUnavailableReason) {
    super(`The feed is unavailable (${reason})`);
  }
}
