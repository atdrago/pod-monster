import 'server-only';

import { captureMessage } from '@sentry/nextjs';
import probeImageSize from 'probe-image-size';

import { safeFetchByteRange } from 'utils/server/safeFetchFeed';

type ImageSize = Pick<probeImageSize.ProbeResult, 'height' | 'width'>;

const PROBE_MAX_BYTES = 1024 * 1024;

// The episode page waits for the probe, and it shows a square when the probe
// fails. Thus, a slow image host must not hold the page for the 20 seconds of
// a feed read.
const PROBE_DEADLINE_MILLISECONDS = 3000;

/**
 * Reads at most the first 1 MiB of an image through the SSRF guard, in at most
 * 3 seconds, and returns its size. Returns `null` on any failure. The guard logs its own
 * failures, and the logs of this function never hold the image URL.
 */
export async function probeImage(
  imageUrl: string,
  seams?: Parameters<typeof safeFetchByteRange>[2],
): Promise<ImageSize | null> {
  const result = await safeFetchByteRange(
    imageUrl,
    {
      byteCount: PROBE_MAX_BYTES,
      deadlineMilliseconds: PROBE_DEADLINE_MILLISECONDS,
    },
    seams,
  );

  if (result.kind === 'error') {
    return null;
  }

  let probeResult: probeImageSize.ProbeResult | null;

  try {
    probeResult = probeImageSize.sync(Buffer.from(result.bytes));
  } catch {
    captureMessage('probe_image_failed', {
      extra: { reason: 'parse_error' },
      level: 'warning',
    });

    return null;
  }

  if (probeResult === null) {
    captureMessage('probe_image_failed', {
      extra: { reason: 'unknown_format' },
      level: 'warning',
    });

    return null;
  }

  return { height: probeResult.height, width: probeResult.width };
}
