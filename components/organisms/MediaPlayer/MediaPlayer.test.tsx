import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, screen, waitFor } from '@testing-library/react';
import { LazyMotion, MotionGlobalConfig, domAnimation } from 'framer-motion';
import { usePathname } from 'next/navigation';
import type { PropsWithChildren } from 'react';
import { commands, page } from 'vitest/browser';

import { MediaProvider, useMediaContext } from 'contexts/MediaContext';
import { SettingsProvider, useSettingsContext } from 'contexts/SettingsContext';
import { decodeBase64UrlSegment, decodeFeedUrlSegment } from 'utils/base64Url';
import { getEpisodePath } from 'utils/paths';

import { MediaPlayer } from './MediaPlayer';

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}));

const DATABASE_NAME = 'pod.monster';
const FEED_URL = 'https://example.com/members/feed.xml?token=Secret123';
const EPISODE_IDENTITY = 'tag:example.com,2026:episode/1?part=a&lang=fr ü';
const EPISODE_TITLE = 'Episode 1';
const FEED_TITLE = 'Example Show';
const SILENT_AUDIO_DURATION_IN_SECONDS = 30;

function deleteDatabase() {
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DATABASE_NAME);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function Providers({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <SettingsProvider>
        <MediaProvider>
          {children}
          <MediaPlayer />
        </MediaProvider>
      </SettingsProvider>
    </QueryClientProvider>
  );
}

async function renderMediaPlayerWithEpisode(
  pathname: string,
  episodeIdentity = EPISODE_IDENTITY,
) {
  vi.mocked(usePathname).mockReturnValue(pathname);

  const rendered = renderHook(
    () => ({ media: useMediaContext(), settings: useSettingsContext() }),
    { wrapper: Providers },
  );

  await waitFor(() =>
    expect(rendered.result.current.settings.isDoneHydratingFromIdb).toBe(true),
  );

  act(() => {
    const { media } = rendered.result.current;

    media.setFeedUrl(FEED_URL);
    media.setEpisodeIdentity(episodeIdentity);
    media.setEpisodeTitle(EPISODE_TITLE);
    media.setSrc('data:audio/mpeg;base64,');
    media.setSize(2);
  });

  return rendered;
}

/**
 * Returns the URL of a silent 8-bit mono WAV file. With this file, the player
 * shows a duration and the feed title, and not the title of a load error.
 */
function createSilentWavUrl(durationInSeconds: number) {
  const sampleRate = 8000;
  const dataSize = sampleRate * durationInSeconds;
  const view = new DataView(new ArrayBuffer(44 + dataSize));

  const writeText = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i += 1) {
      view.setUint8(offset + i, text.charCodeAt(i));
    }
  };

  writeText(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeText(8, 'WAVE');
  writeText(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate, true);
  view.setUint16(32, 1, true);
  view.setUint16(34, 8, true);
  writeText(36, 'data');
  view.setUint32(40, dataSize, true);

  return URL.createObjectURL(new Blob([view.buffer], { type: 'audio/wav' }));
}

/**
 * The screenshot takes this frame and not the root of the player, because the
 * shadow of the player falls outside the root.
 *
 * The sentinel of the player sits 17px below the player. In the pinned frame,
 * the short scroll container clips the sentinel, so the player pins to the
 * bottom of the container.
 */
function PlayerFrame({ isPinned }: { isPinned: boolean }) {
  if (isPinned) {
    return (
      <div style={{ height: 240, overflowY: 'auto', scrollbarWidth: 'none' }}>
        <div style={{ height: 1000 }} />
        <MediaPlayer />
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 32 }}>
      <MediaPlayer />
    </div>
  );
}

async function renderMediaPlayerFrame({
  isPinned = false,
  size,
}: {
  isPinned?: boolean;
  size: 1 | 2;
}) {
  vi.mocked(usePathname).mockReturnValue('/');

  const rendered = renderHook(
    () => ({ media: useMediaContext(), settings: useSettingsContext() }),
    {
      wrapper: ({ children }: PropsWithChildren) => (
        <QueryClientProvider client={new QueryClient()}>
          <SettingsProvider>
            <LazyMotion features={domAnimation}>
              <MediaProvider>
                {children}
                <PlayerFrame isPinned={isPinned} />
              </MediaProvider>
            </LazyMotion>
          </SettingsProvider>
        </QueryClientProvider>
      ),
    },
  );

  await waitFor(() =>
    expect(rendered.result.current.settings.isDoneHydratingFromIdb).toBe(true),
  );

  act(() => {
    const { media } = rendered.result.current;

    media.setFeedTitle(FEED_TITLE);
    media.setFeedUrl(FEED_URL);
    media.setEpisodeIdentity(EPISODE_IDENTITY);
    media.setEpisodeTitle(EPISODE_TITLE);
    media.setSrc(createSilentWavUrl(SILENT_AUDIO_DURATION_IN_SECONDS));
    media.setSize(size);
  });

  expect(await screen.findByText('00:00:30')).toBeInTheDocument();
  expect(screen.getByText(FEED_TITLE)).toBeInTheDocument();

  return screen.getByRole('complementary').parentElement;
}

describe('MediaPlayer', () => {
  beforeEach(async () => {
    await deleteDatabase();
  });

  it('should give back the feed URL and the identity after the route decode of the episode path', () => {
    const [, feeds, feedSegment, episodes, episodeSegment] = getEpisodePath({
      episodeIdentity: EPISODE_IDENTITY,
      feedUrl: FEED_URL,
    }).split('/');

    expect([feeds, episodes]).toEqual(['feeds', 'episodes']);
    expect(decodeFeedUrlSegment(feedSegment)).toBe(FEED_URL);
    expect(decodeBase64UrlSegment(episodeSegment)).toBe(EPISODE_IDENTITY);
  });

  it('should mark the episode in the player as the episode of the page on its episode path', async () => {
    await renderMediaPlayerWithEpisode(
      getEpisodePath({ episodeIdentity: EPISODE_IDENTITY, feedUrl: FEED_URL }),
    );

    expect(await screen.findByText(EPISODE_TITLE)).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: EPISODE_TITLE }),
    ).not.toBeInTheDocument();
  });

  it('should link to the episode in the player from another page', async () => {
    await renderMediaPlayerWithEpisode('/');

    expect(
      await screen.findByRole('link', { name: EPISODE_TITLE }),
    ).toHaveAttribute(
      'href',
      getEpisodePath({ episodeIdentity: EPISODE_IDENTITY, feedUrl: FEED_URL }),
    );
  });

  it('should link to the episode in the player from the page of an episode whose path starts with its path', async () => {
    const playerEpisodePath = getEpisodePath({
      episodeIdentity: 'abc',
      feedUrl: FEED_URL,
    });
    const pageEpisodePath = getEpisodePath({
      episodeIdentity: 'abcd',
      feedUrl: FEED_URL,
    });

    expect(pageEpisodePath.startsWith(playerEpisodePath)).toBe(true);

    await renderMediaPlayerWithEpisode(pageEpisodePath, 'abc');

    expect(
      await screen.findByRole('link', { name: EPISODE_TITLE }),
    ).toHaveAttribute('href', playerEpisodePath);
  });

  describe('screenshots', () => {
    // The player and its parts animate in. A screenshot taken before the end
    // of a spring animation can differ by one pixel from run to run.
    beforeAll(() => {
      MotionGlobalConfig.skipAnimations = true;
    });

    afterAll(() => {
      MotionGlobalConfig.skipAnimations = false;
    });

    describe('size', () => {
      it('should render size 1 unpinned', async () => {
        const element = await renderMediaPlayerFrame({ size: 1 });
        await expect(element).toMatchScreenshot('mediaPlayer-size-1.png');
      });

      it('should render size 2 unpinned', async () => {
        const element = await renderMediaPlayerFrame({ size: 2 });
        await expect(element).toMatchScreenshot('mediaPlayer-size-2.png');
      });
    });

    describe('pinned', () => {
      it('should render size 1 pinned to the bottom of a scroll container', async () => {
        const element = await renderMediaPlayerFrame({
          isPinned: true,
          size: 1,
        });
        await expect(element).toMatchScreenshot('mediaPlayer-pinned.png');
      });

      describe('at 600px', () => {
        beforeAll(async () => {
          await page.viewport(600, 896);
        });

        afterAll(async () => {
          await page.viewport(414, 896);
        });

        it('should render size 1 pinned at the pinned width', async () => {
          const element = await renderMediaPlayerFrame({
            isPinned: true,
            size: 1,
          });
          await expect(element).toMatchScreenshot('mediaPlayer-pinned-600.png');
        });
      });
    });

    describe('wide', () => {
      beforeAll(async () => {
        await page.viewport(1024, 768);
      });

      afterAll(async () => {
        await page.viewport(414, 896);
      });

      it('should render size 2 unpinned at the unpinned maximum width', async () => {
        const element = await renderMediaPlayerFrame({ size: 2 });
        await expect(element).toMatchScreenshot('mediaPlayer-size-2-wide.png');
      });
    });

    describe('dark', () => {
      beforeAll(async () => {
        await commands.setColorScheme('dark');
      });

      afterAll(async () => {
        await commands.setColorScheme('light');
      });

      it('should render size 1 unpinned', async () => {
        const element = await renderMediaPlayerFrame({ size: 1 });
        await expect(element).toMatchScreenshot('mediaPlayer-size-1-dark.png');
      });

      it('should render size 2 unpinned', async () => {
        const element = await renderMediaPlayerFrame({ size: 2 });
        await expect(element).toMatchScreenshot('mediaPlayer-size-2-dark.png');
      });

      it('should render size 1 pinned to the bottom of a scroll container', async () => {
        const element = await renderMediaPlayerFrame({
          isPinned: true,
          size: 1,
        });
        await expect(element).toMatchScreenshot('mediaPlayer-pinned-dark.png');
      });

      describe('at 600px', () => {
        beforeAll(async () => {
          await page.viewport(600, 896);
        });

        afterAll(async () => {
          await page.viewport(414, 896);
        });

        it('should render size 1 pinned at the pinned width', async () => {
          const element = await renderMediaPlayerFrame({
            isPinned: true,
            size: 1,
          });
          await expect(element).toMatchScreenshot(
            'mediaPlayer-pinned-600-dark.png',
          );
        });
      });
    });
  });
});
