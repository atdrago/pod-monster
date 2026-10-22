import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react';
import type { ComponentProps, PropsWithChildren } from 'react';
import { commands } from 'vitest/browser';

import { MediaProvider, useMediaContext } from 'contexts/MediaContext';
import { SettingsProvider, useSettingsContext } from 'contexts/SettingsContext';
import type { PodcastEpisode } from 'types/PodcastFeed';

import { EpisodePlayButton } from './EpisodePlayButton';

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

const DATABASE_NAME = 'pod.monster';
const EPISODE: PodcastEpisode = {
  chaptersUrl: 'https://example.com/chapters.json',
  enclosureType: 'audio/mpeg',
  enclosureUrl: 'https://example.com/episode-1.mp3',
  feedImage: 'https://example.com/feed.jpg',
  feedTitle: 'Example Show',
  feedUrl: 'https://example.com/members/feed.xml?token=Secret123',
  identity: 'episode-1',
  title: 'Episode 1',
};

function deleteDatabase() {
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DATABASE_NAME);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function renderEpisodePlayButton(
  episode: PodcastEpisode,
  { onPlay, startTime }: { onPlay?: () => void; startTime?: number } = {},
) {
  const rendered = renderHook(
    () => ({ media: useMediaContext(), settings: useSettingsContext() }),
    {
      wrapper: ({ children }: PropsWithChildren) => (
        <QueryClientProvider client={new QueryClient()}>
          <SettingsProvider>
            <MediaProvider>
              {children}
              <EpisodePlayButton
                currentChapter={null}
                episode={episode}
                startTime={startTime}
                onPlay={onPlay}
              />
            </MediaProvider>
          </SettingsProvider>
        </QueryClientProvider>
      ),
    },
  );

  await waitFor(() =>
    expect(rendered.result.current.settings.isDoneHydratingFromIdb).toBe(true),
  );

  return rendered;
}

/** Waits for the hydration, which enables the button. */
async function renderEpisodePlayButtonForScreenshot(
  props: Partial<ComponentProps<typeof EpisodePlayButton>> = {},
) {
  const rendered = render(
    <QueryClientProvider client={new QueryClient()}>
      <SettingsProvider>
        <MediaProvider>
          <EpisodePlayButton
            currentChapter={null}
            episode={EPISODE}
            {...props}
          />
        </MediaProvider>
      </SettingsProvider>
    </QueryClientProvider>,
  );

  await waitFor(() =>
    expect(screen.getByLabelText('Play podcast')).toBeEnabled(),
  );

  return rendered;
}

describe('EpisodePlayButton', () => {
  beforeEach(async () => {
    await deleteDatabase();
  });

  it('should put the feed URL and the identity of the episode in the player', async () => {
    const { result } = await renderEpisodePlayButton(EPISODE, {
      startTime: 42,
    });

    fireEvent.click(screen.getByLabelText('Play podcast'));

    await waitFor(() =>
      expect(result.current.media.episodeIdentity).toBe('episode-1'),
    );
    expect(result.current.media.feedUrl).toBe(EPISODE.feedUrl);
    expect(result.current.media.chaptersUrl).toBe(EPISODE.chaptersUrl);
    expect(result.current.media.src).toBe(EPISODE.enclosureUrl);
    expect(result.current.media.currentTime).toBe(42);
    expect(screen.getByLabelText('Pause podcast')).toBeVisible();
  });

  it('should load the episode in the player when another episode has the same enclosure URL', async () => {
    const { result } = await renderEpisodePlayButton(EPISODE);

    act(() => {
      result.current.media.setFeedUrl('https://example.com/other-feed.xml');
      result.current.media.setEpisodeIdentity('other-episode');
      result.current.media.setSrc(EPISODE.enclosureUrl ?? null);
    });

    fireEvent.click(screen.getByLabelText('Play podcast'));

    await waitFor(() =>
      expect(result.current.media.episodeIdentity).toBe('episode-1'),
    );
    expect(result.current.media.feedUrl).toBe(EPISODE.feedUrl);
  });

  it('should disable the button of an episode with no enclosure URL', async () => {
    const { result } = await renderEpisodePlayButton({
      ...EPISODE,
      enclosureUrl: undefined,
    });

    const playButton = screen.getByLabelText('Play podcast');

    expect(playButton).toBeDisabled();

    fireEvent.click(playButton);

    expect(result.current.media.episodeIdentity).toBeNull();
    expect(result.current.media.src).toBeNull();
  });

  it('should start an episode with no start time from its saved position', async () => {
    const seeded = await renderEpisodePlayButton(EPISODE);

    await act(() =>
      seeded.result.current.settings.setEpisodeSettingsItem(
        { episodeIdentity: EPISODE.identity, feedUrl: EPISODE.feedUrl },
        { currentTime: 2412, duration: 3600 },
      ),
    );

    fireEvent.click(screen.getByLabelText('Play podcast'));

    await waitFor(() =>
      expect(seeded.result.current.media.episodeIdentity).toBe('episode-1'),
    );
    expect(seeded.result.current.media.currentTime).toBe(2412);
  });

  it('should call `onPlay` when a click starts the episode, and not when a click pauses it', async () => {
    const onPlay = vi.fn();

    await renderEpisodePlayButton(EPISODE, { onPlay });

    fireEvent.click(screen.getByLabelText('Play podcast'));

    await waitFor(() =>
      expect(screen.getByLabelText('Pause podcast')).toBeVisible(),
    );
    expect(onPlay).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByLabelText('Pause podcast'));

    await waitFor(() =>
      expect(screen.getByLabelText('Play podcast')).toBeVisible(),
    );
    expect(onPlay).toHaveBeenCalledOnce();
  });

  it('should show the explicit icon only for an explicit episode', async () => {
    const { unmount } = await renderEpisodePlayButton({
      ...EPISODE,
      explicit: false,
    });

    expect(
      screen.getByText('Episode 1').querySelector('svg'),
    ).not.toBeInTheDocument();

    unmount();
    await renderEpisodePlayButton({ ...EPISODE, explicit: true });

    expect(
      screen.getByText('Episode 1').querySelector('svg'),
    ).toBeInTheDocument();
  });

  describe('default', () => {
    it('should render the play button and the title of a paused episode', async () => {
      const { container } = await renderEpisodePlayButtonForScreenshot();
      const element = container.firstElementChild;
      await expect(element).toMatchScreenshot('episodePlayButton-default.png');
    });
  });

  describe('explicit', () => {
    it('should render the explicit icon before the title', async () => {
      const { container } = await renderEpisodePlayButtonForScreenshot({
        episode: { ...EPISODE, explicit: true },
      });
      const element = container.firstElementChild;
      await expect(element).toMatchScreenshot('episodePlayButton-explicit.png');
    });
  });

  describe('currentChapter', () => {
    it('should render the title of the chapter and the link of the chapter', async () => {
      const { container } = await renderEpisodePlayButtonForScreenshot({
        currentChapter: {
          startTime: 60,
          title: 'Chapter 2',
          url: 'https://example.com/chapter-2',
        },
      });
      const element = container.firstElementChild;
      await expect(element).toMatchScreenshot(
        'episodePlayButton-current-chapter.png',
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

    it('should render the play button and the title of a paused episode', async () => {
      const { container } = await renderEpisodePlayButtonForScreenshot();
      const element = container.firstElementChild;
      await expect(element).toMatchScreenshot(
        'episodePlayButton-default-dark.png',
      );
    });

    it('should render the title of the chapter and the link of the chapter', async () => {
      const { container } = await renderEpisodePlayButtonForScreenshot({
        currentChapter: {
          startTime: 60,
          title: 'Chapter 2',
          url: 'https://example.com/chapter-2',
        },
      });
      const element = container.firstElementChild;
      await expect(element).toMatchScreenshot(
        'episodePlayButton-current-chapter-dark.png',
      );
    });
  });
});
