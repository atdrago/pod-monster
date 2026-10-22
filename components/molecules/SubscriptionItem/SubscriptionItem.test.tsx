import { act, renderHook, screen, waitFor } from '@testing-library/react';
import type { ComponentProps, PropsWithChildren } from 'react';
import { commands } from 'vitest/browser';

import { SettingsProvider, useSettingsContext } from 'contexts/SettingsContext';
import { getPodcastPath } from 'utils/paths';

import { SubscriptionItem } from './SubscriptionItem';

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

const DATABASE_NAME = 'pod.monster';
const FEED_URL = 'https://example.com/feed.xml';
const TITLE = 'Example Show';
const FEED_EPISODES_DATA = [
  {
    datePublished: Date.parse('2026-10-10T12:00:00.000Z') / 1000,
    enclosureUrl: 'https://example.com/episode-1.mp3',
    guid: 'episode-1',
  },
];
const FEED_SETTINGS_ITEM = {
  subscribedAt: '2026-10-01T00:00:00.000Z',
  title: TITLE,
};

function deleteDatabase() {
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DATABASE_NAME);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * The root has a negative left margin, so that the dot hangs in the gutter of
 * the page. The image shows the padded box around the root, so that it
 * records the margin.
 */
async function renderSubscriptionItem(
  props: Partial<ComponentProps<typeof SubscriptionItem>> = {},
) {
  const rendered = renderHook(() => useSettingsContext(), {
    wrapper: ({ children }: PropsWithChildren) => (
      <SettingsProvider>
        {children}
        <div style={{ padding: 16 }}>
          <SubscriptionItem
            feedEpisodesData={FEED_EPISODES_DATA}
            feedUrl={FEED_URL}
            image="/apple-touch-icon.png"
            title={TITLE}
            {...props}
          />
        </div>
      </SettingsProvider>
    ),
  });

  await waitFor(() =>
    expect(rendered.result.current.isDoneHydratingFromIdb).toBe(true),
  );
  await act(() =>
    rendered.result.current.setFeedSettingsItem(
      { feedUrl: FEED_URL },
      FEED_SETTINGS_ITEM,
    ),
  );

  const link = screen.getByRole('link');
  const image = link.querySelector('img');

  if (image === null) {
    throw new Error('The artwork has no image.');
  }

  await image.decode();

  return link;
}

describe('SubscriptionItem', () => {
  beforeEach(async () => {
    await deleteDatabase();
  });

  describe('new episodes', () => {
    it('should render the dot after hydration', async () => {
      const link = await renderSubscriptionItem();
      const element = link.parentElement;

      expect(
        screen.getByRole('status', { name: 'New episodes.' }),
      ).toBeVisible();
      await expect(element).toMatchScreenshot(
        'subscriptionItem-new-episodes.png',
      );
    });

    it('should link to the page of the show', async () => {
      const link = await renderSubscriptionItem();

      expect(link).toHaveAttribute(
        'href',
        getPodcastPath({ feedUrl: FEED_URL }),
      );
    });
  });

  describe('no new episodes', () => {
    it('should render a transparent dot that is hidden from assistive technology', async () => {
      const link = await renderSubscriptionItem({ feedEpisodesData: [] });
      const element = link.parentElement;

      expect(
        screen.queryByRole('status', { name: 'New episodes.' }),
      ).toBeNull();
      await expect(element).toMatchScreenshot(
        'subscriptionItem-no-new-episodes.png',
      );
    });
  });

  describe('dark', () => {
    beforeAll(async () => {
      await commands.setColorScheme('dark');
    });

    afterAll(async () => {
      await commands.setColorScheme('light');
    });

    it('should render the dot after hydration', async () => {
      const link = await renderSubscriptionItem();
      const element = link.parentElement;
      await expect(element).toMatchScreenshot(
        'subscriptionItem-new-episodes-dark.png',
      );
    });
  });
});
