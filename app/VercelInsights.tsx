'use client';

import { Analytics, type BeforeSendEvent } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

import { redactFeedPaths } from 'utils/redactFeedPaths';

const QUERY_AND_FRAGMENT_PATTERN = /[?#].*$/;

function redactInsightsEvent<TEvent extends Pick<BeforeSendEvent, 'url'>>(
  event: TEvent,
): TEvent {
  return {
    ...event,
    url: redactFeedPaths(event.url.replace(QUERY_AND_FRAGMENT_PATTERN, '')),
  };
}

export const VercelInsights = () => (
  <>
    <SpeedInsights beforeSend={redactInsightsEvent} />
    <Analytics beforeSend={redactInsightsEvent} />
  </>
);
