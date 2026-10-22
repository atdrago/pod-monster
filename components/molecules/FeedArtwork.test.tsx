import { act, render, renderHook, waitFor } from '@testing-library/react';
import { openDB } from 'idb';
import type { ComponentProps, PropsWithChildren } from 'react';
import { commands } from 'vitest/browser';

import { SettingsProvider, useSettingsContext } from 'contexts/SettingsContext';

import { FeedArtwork } from './FeedArtwork';

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

const DATABASE_NAME = 'pod.monster';
const FEED_URL = 'https://example.com/feed.xml';
const PRIVATE_FEED_URL =
  'https://www.patreon.com/rss/example?auth=Secret123&show=456';
const OLD_IMAGE = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
const NEW_IMAGE = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACw=';
const FEED_SETTINGS_ITEM = {
  image: OLD_IMAGE,
  podcastIndexId: 920666,
  subscribedAt: '2026-10-18T00:00:00.000Z',
  title: 'Example Show',
};

function deleteDatabase() {
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DATABASE_NAME);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function readFeedSettings() {
  const database = await openDB(DATABASE_NAME);
  const transaction = database.transaction('feedSettings');
  const [keys, values] = await Promise.all([
    transaction.store.getAllKeys(),
    transaction.store.getAll(),
  ]);

  database.close();

  return Object.fromEntries(keys.map((key, index) => [key, values[index]]));
}

async function renderFeedArtwork({
  feedUrl,
  src,
}: {
  feedUrl: string;
  src?: string;
}) {
  const rendered = renderHook(() => useSettingsContext(), {
    wrapper: ({ children }: PropsWithChildren) => (
      <SettingsProvider>
        {children}
        <FeedArtwork alt="" feedUrl={feedUrl} src={src} />
      </SettingsProvider>
    ),
  });

  await waitFor(() =>
    expect(rendered.result.current.isDoneHydratingFromIdb).toBe(true),
  );

  return rendered;
}

/**
 * The shadow paints outside the root. The image shows the padded box around
 * the root, so that it records the shadow.
 */
async function renderFeedArtworkForScreenshot(
  props: Partial<ComponentProps<typeof FeedArtwork>> = {},
) {
  const { container } = render(
    <SettingsProvider>
      <div style={{ padding: 24, width: 'fit-content' }}>
        <FeedArtwork
          alt=""
          feedUrl={FEED_URL}
          height={128}
          shadow={true}
          width={128}
          {...props}
        />
      </div>
    </SettingsProvider>,
  );

  await container.querySelector('img')?.decode();

  return container.firstElementChild;
}

describe('FeedArtwork', () => {
  beforeEach(async () => {
    await deleteDatabase();
  });

  it('should write no record for a show that is not in the library', async () => {
    const { result } = await renderFeedArtwork({
      feedUrl: FEED_URL,
      src: NEW_IMAGE,
    });

    // A write of the effect starts before this write, so it ends first.
    await act(() =>
      result.current.setEpisodeSettingsItem(
        { episodeIdentity: 'episode-1', feedUrl: FEED_URL },
        { currentTime: 1 },
      ),
    );

    expect(result.current.feedSettings).toEqual({});
    expect(await readFeedSettings()).toEqual({});
  });

  it('should write no record for a private show that is not in the library', async () => {
    const { result } = await renderFeedArtwork({
      feedUrl: PRIVATE_FEED_URL,
      src: NEW_IMAGE,
    });

    await act(() =>
      result.current.setEpisodeSettingsItem(
        { episodeIdentity: 'episode-1', feedUrl: PRIVATE_FEED_URL },
        { currentTime: 1 },
      ),
    );

    expect(result.current.feedSettings).toEqual({});
    expect(await readFeedSettings()).toEqual({});
  });

  it('should update only the image of a show in the library', async () => {
    const { result } = await renderFeedArtwork({
      feedUrl: FEED_URL,
      src: NEW_IMAGE,
    });

    await act(() =>
      result.current.setFeedSettingsItem(
        { feedUrl: FEED_URL },
        FEED_SETTINGS_ITEM,
      ),
    );

    await waitFor(() =>
      expect(result.current.getFeedSettingsItem({ feedUrl: FEED_URL })).toEqual(
        { ...FEED_SETTINGS_ITEM, image: NEW_IMAGE },
      ),
    );
    expect(await readFeedSettings()).toEqual({
      [FEED_URL]: { ...FEED_SETTINGS_ITEM, image: NEW_IMAGE },
    });
  });

  it('should keep the image of a show in the library when it has no image to show', async () => {
    const { result } = await renderFeedArtwork({ feedUrl: FEED_URL });

    await act(() =>
      result.current.setFeedSettingsItem(
        { feedUrl: FEED_URL },
        FEED_SETTINGS_ITEM,
      ),
    );
    await act(() =>
      result.current.setEpisodeSettingsItem(
        { episodeIdentity: 'episode-1', feedUrl: FEED_URL },
        { currentTime: 1 },
      ),
    );

    expect(await readFeedSettings()).toEqual({
      [FEED_URL]: FEED_SETTINGS_ITEM,
    });
  });

  describe('src', () => {
    it('should render the image of the show with a shadow', async () => {
      const element = await renderFeedArtworkForScreenshot({
        src: '/apple-touch-icon.png',
      });
      await expect(element).toMatchScreenshot('feedArtwork-image.png');
    });

    it('should render an empty square when the show has no image', async () => {
      const element = await renderFeedArtworkForScreenshot();
      await expect(element).toMatchScreenshot('feedArtwork-no-image.png');
    });
  });

  describe('dark', () => {
    beforeAll(async () => {
      await commands.setColorScheme('dark');
    });

    afterAll(async () => {
      await commands.setColorScheme('light');
    });

    it('should render the image of the show with a shadow', async () => {
      const element = await renderFeedArtworkForScreenshot({
        src: '/apple-touch-icon.png',
      });
      await expect(element).toMatchScreenshot('feedArtwork-image-dark.png');
    });

    it('should render an empty square when the show has no image', async () => {
      const element = await renderFeedArtworkForScreenshot();
      await expect(element).toMatchScreenshot('feedArtwork-no-image-dark.png');
    });
  });
});
