import {
  act,
  fireEvent,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react';
import { openDB } from 'idb';
import type { PropsWithChildren } from 'react';

import { SettingsProvider, useSettingsContext } from 'contexts/SettingsContext';
import type { PodcastFeed } from 'types/PodcastFeed';

import { SubscribeButton } from './SubscribeButton';

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

const DATABASE_NAME = 'pod.monster';
const RSS_ONLY_FEED: PodcastFeed = {
  format: 'rss',
  image: 'https://example.com/image.jpg',
  isSerial: false,
  link: 'https://example.com',
  title: 'Example Show',
  url: 'https://example.com/members/feed.xml?token=Secret123',
};
const PODCAST_INDEX_FEED: PodcastFeed = {
  ...RSS_ONLY_FEED,
  podcastIndexId: 920666,
  url: 'https://example.com/feed.xml',
};

function deleteDatabase() {
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DATABASE_NAME);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function readFeedSettingsKeys() {
  const database = await openDB(DATABASE_NAME);
  const keys = await database.getAllKeys('feedSettings');

  database.close();

  return keys.map(String);
}

async function renderSubscribeButton(feed: PodcastFeed) {
  const rendered = renderHook(() => useSettingsContext(), {
    wrapper: ({ children }: PropsWithChildren) => (
      <SettingsProvider>
        {children}
        <SubscribeButton feed={feed} />
      </SettingsProvider>
    ),
  });

  await waitFor(() =>
    expect(rendered.result.current.isDoneHydratingFromIdb).toBe(true),
  );

  return rendered;
}

describe('SubscribeButton', () => {
  beforeEach(async () => {
    await deleteDatabase();
  });

  it('should store a show with no Podcast Index id under its feed URL, and keep it after a new render', async () => {
    const { unmount } = await renderSubscribeButton(RSS_ONLY_FEED);

    fireEvent.click(screen.getByText('Subscribe'));

    await waitFor(() => expect(screen.getByText('Unsubscribe')).toBeVisible());

    unmount();

    const { result } = await renderSubscribeButton(RSS_ONLY_FEED);

    expect(screen.getByText('Unsubscribe')).toBeVisible();
    expect(
      result.current.getFeedSettingsItem({ feedUrl: RSS_ONLY_FEED.url }),
    ).toEqual({
      htmlUrl: 'https://example.com',
      image: 'https://example.com/image.jpg',
      subscribedAt: expect.any(String),
      title: 'Example Show',
      type: 'rss',
    });
    expect(await readFeedSettingsKeys()).toEqual([RSS_ONLY_FEED.url]);
  });

  it('should store the Podcast Index id when the show has one', async () => {
    const { result } = await renderSubscribeButton(PODCAST_INDEX_FEED);

    fireEvent.click(screen.getByText('Subscribe'));

    await waitFor(() =>
      expect(
        result.current.getFeedSettingsItem({ feedUrl: PODCAST_INDEX_FEED.url }),
      ).toEqual(expect.objectContaining({ podcastIndexId: 920666 })),
    );
  });

  it('should remove the show from the library on a second click', async () => {
    const { result } = await renderSubscribeButton(RSS_ONLY_FEED);

    fireEvent.click(screen.getByText('Subscribe'));
    await waitFor(() => expect(screen.getByText('Unsubscribe')).toBeVisible());
    fireEvent.click(screen.getByText('Unsubscribe'));

    await waitFor(() => expect(screen.getByText('Subscribe')).toBeVisible());
    await waitFor(() =>
      expect(
        result.current.getFeedSettingsItem({ feedUrl: RSS_ONLY_FEED.url }),
      ).toEqual(expect.objectContaining({ subscribedAt: null })),
    );
  });

  it('should keep the Podcast Index id of a show in the library when the page has none', async () => {
    const { result } = await renderSubscribeButton({
      ...PODCAST_INDEX_FEED,
      podcastIndexId: undefined,
    });

    await act(() =>
      result.current.setFeedSettingsItem(
        { feedUrl: PODCAST_INDEX_FEED.url },
        { podcastIndexId: 920666, subscribedAt: null, title: 'Example Show' },
      ),
    );
    fireEvent.click(screen.getByText('Subscribe'));

    await waitFor(() => expect(screen.getByText('Unsubscribe')).toBeVisible());
    await waitFor(() =>
      expect(
        result.current.getFeedSettingsItem({ feedUrl: PODCAST_INDEX_FEED.url }),
      ).toEqual(expect.objectContaining({ podcastIndexId: 920666 })),
    );
  });

  it('should disable the button until hydration ends', () => {
    renderHook(() => useSettingsContext(), {
      wrapper: ({ children }: PropsWithChildren) => (
        <SettingsProvider>
          {children}
          <SubscribeButton feed={RSS_ONLY_FEED} />
        </SettingsProvider>
      ),
    });

    expect(screen.getByText('Subscribe')).toBeDisabled();
  });

  it('should disable the button while its write is pending', async () => {
    await renderSubscribeButton(RSS_ONLY_FEED);

    const button = screen.getByText('Subscribe');

    fireEvent.click(button);

    expect(button).toBeDisabled();
    await waitFor(() => expect(button).toBeEnabled());
    expect(button).toHaveTextContent('Unsubscribe');
  });
});
