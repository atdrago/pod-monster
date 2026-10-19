import { render } from '@testing-library/react';
import type { Analytics } from '@vercel/analytics/next';
import type { SpeedInsights } from '@vercel/speed-insights/next';

import { VercelInsights } from './VercelInsights';

const { analyticsMock, speedInsightsMock } = vi.hoisted(() => ({
  analyticsMock: vi.fn<typeof Analytics>(() => null),
  speedInsightsMock: vi.fn<typeof SpeedInsights>(() => null),
}));

vi.mock('@vercel/analytics/next', () => ({ Analytics: analyticsMock }));
vi.mock('@vercel/speed-insights/next', () => ({
  SpeedInsights: speedInsightsMock,
}));

function renderAnalyticsBeforeSend() {
  render(<VercelInsights />);

  return analyticsMock.mock.lastCall?.[0].beforeSend;
}

function renderSpeedInsightsBeforeSend() {
  render(<VercelInsights />);

  return speedInsightsMock.mock.lastCall?.[0].beforeSend;
}

describe('VercelInsights', () => {
  it('should render no element', () => {
    const { container } = render(<VercelInsights />);

    expect(container).toBeEmptyDOMElement();
  });

  describe('Analytics', () => {
    it('should replace the feed path and remove the query of a page view', () => {
      const beforeSend = renderAnalyticsBeforeSend();

      expect(
        beforeSend?.({
          type: 'pageview',
          url: 'https://pod.monster/feeds/abc/episodes/def?t=10',
        }),
      ).toEqual({
        type: 'pageview',
        url: 'https://pod.monster/feeds/[feedUrlBase64]/episodes/[guidBase64]',
      });
    });
  });

  describe('SpeedInsights', () => {
    it('should replace the feed path and remove the query of a vital', () => {
      const beforeSend = renderSpeedInsightsBeforeSend();

      expect(
        beforeSend?.({
          type: 'vital',
          url: 'https://pod.monster/feeds/abc/episodes/def?t=10',
        }),
      ).toEqual({
        type: 'vital',
        url: 'https://pod.monster/feeds/[feedUrlBase64]/episodes/[guidBase64]',
      });
    });

    it('should keep a URL with no feed path as it is', () => {
      const beforeSend = renderSpeedInsightsBeforeSend();

      expect(
        beforeSend?.({ type: 'vital', url: 'https://pod.monster/about' }),
      ).toEqual({ type: 'vital', url: 'https://pod.monster/about' });
    });
  });
});
