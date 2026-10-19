import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react';
import type { PropsWithChildren } from 'react';

import { MediaProvider, useMediaContext } from 'contexts/MediaContext';
import { SettingsProvider, useSettingsContext } from 'contexts/SettingsContext';
import { fetchPodcastEpisodeChapters } from 'rest/fetchPodcastEpisodeChapters';
import { fetchPodcastEpisodeTranscript } from 'rest/fetchPodcastEpisodeTranscript';
import type { PodcastEpisode, PodcastFeed } from 'types/PodcastFeed';

import { EpisodePage } from './EpisodePage';

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

vi.mock('rest/fetchPodcastEpisodeChapters', () => ({
  fetchPodcastEpisodeChapters: vi.fn(),
}));

vi.mock('rest/fetchPodcastEpisodeTranscript', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('rest/fetchPodcastEpisodeTranscript')
  >()),
  fetchPodcastEpisodeTranscript: vi.fn(),
}));

const FEED: PodcastFeed = {
  format: 'rss',
  isSerial: false,
  title: 'Example Show',
  url: 'https://example.com/feed.xml',
};
const EPISODE: PodcastEpisode = {
  description: '<p>Episode notes</p>',
  duration: 1800,
  enclosureType: 'audio/mpeg',
  enclosureUrl: 'https://example.com/episode-1.mp3',
  feedTitle: FEED.title,
  feedUrl: FEED.url,
  identity: 'episode-1',
  title: 'Episode 1',
};
const UNSAFE_FEED_HTML = [
  '<p>Notes for <a href="https://example.com/notes" rel="me">the show</a></p>',
  '<script>window.isFeedScriptRun = true;</script>',
  '<p onclick="window.isFeedHandlerRun = true">Click here</p>',
  '<p><a href="javascript:window.isFeedLinkRun = true">Bad link</a></p>',
].join('\n');
const FEED_LINK_REL = 'nofollow ugc noopener noreferrer';
const DATABASE_NAME = 'pod.monster';
const EPISODE_REFERENCE = {
  episodeIdentity: EPISODE.identity,
  feedUrl: EPISODE.feedUrl,
};

function createQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderEpisodePage(
  episode: PodcastEpisode,
  queryClient = createQueryClient(),
) {
  const rendered = render(
    <QueryClientProvider client={queryClient}>
      <EpisodePage episode={episode} feed={FEED} />
    </QueryClientProvider>,
  );

  return {
    ...rendered,
    rerenderEpisode: (nextEpisode: PodcastEpisode) =>
      rendered.rerender(
        <QueryClientProvider client={queryClient}>
          <EpisodePage episode={nextEpisode} feed={FEED} />
        </QueryClientProvider>,
      ),
  };
}

function deleteDatabase() {
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DATABASE_NAME);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/** Saves a position for the episode, and can put the episode in the player. */
async function seedSettings({
  currentTime,
  isInThePlayer = false,
}: {
  currentTime: number;
  isInThePlayer?: boolean;
}) {
  const { result, unmount } = renderHook(() => useSettingsContext(), {
    wrapper: SettingsProvider,
  });

  await waitFor(() => expect(result.current.isDoneHydratingFromIdb).toBe(true));
  await act(() =>
    result.current.setEpisodeSettingsItem(EPISODE_REFERENCE, {
      currentTime,
      duration: EPISODE.duration,
    }),
  );

  if (isInThePlayer) {
    await act(() =>
      result.current.setMediaPlayerSettings({
        chaptersUrl: null,
        episodeIdentity: EPISODE.identity,
        episodeImage: null,
        episodeImageDimensions: null,
        episodeTitle: EPISODE.title,
        feedImage: null,
        feedTitle: EPISODE.feedTitle,
        feedUrl: EPISODE.feedUrl,
        isMuted: false,
        isPaused: true,
        isTranscriptVisibleAsSubtitle: true,
        playbackRate: 1,
        size: 1,
        src: EPISODE.enclosureUrl ?? null,
        srcType: 'audio/mpeg',
        volume: 1,
      }),
    );
  }

  unmount();
}

/** Renders the page with the player state, as the root layout does. */
function renderEpisodePageWithPlayer({
  episode = EPISODE,
  t,
}: { episode?: PodcastEpisode; t?: string } = {}) {
  const queryClient = createQueryClient();
  let currentStartTime = t;

  const rendered = renderHook(
    () => ({ media: useMediaContext(), settings: useSettingsContext() }),
    {
      wrapper: function Wrapper({ children }: PropsWithChildren) {
        return (
          <QueryClientProvider client={queryClient}>
            <SettingsProvider>
              <MediaProvider>
                {children}
                <EpisodePage
                  episode={episode}
                  feed={FEED}
                  startTimeParam={currentStartTime}
                />
              </MediaProvider>
            </SettingsProvider>
          </QueryClientProvider>
        );
      },
    },
  );

  return {
    ...rendered,
    rerenderWithStartTime: (nextStartTime: string) => {
      currentStartTime = nextStartTime;
      rendered.rerender();
    },
  };
}

async function renderHydratedEpisodePageWithPlayer(
  options?: Parameters<typeof renderEpisodePageWithPlayer>[0],
) {
  const rendered = renderEpisodePageWithPlayer(options);

  await waitFor(() =>
    expect(rendered.result.current.settings.isDoneHydratingFromIdb).toBe(true),
  );

  return rendered;
}

function getUrlStartTime() {
  return new URL(window.location.href).searchParams.get('t');
}

function setUrlStartTime(t: string) {
  const url = new URL(window.location.href);

  url.searchParams.set('t', t);
  window.history.replaceState(window.history.state, '', url);
}

function queryPrompt() {
  return screen.queryByRole('region', { name: /^Start Listening at/ });
}

function expectNoUnsafeFeedHtml(container: HTMLElement) {
  expect(container.querySelector('script')).not.toBeInTheDocument();
  expect(container.querySelector('[onclick]')).not.toBeInTheDocument();
  expect(
    container.querySelector('[href^="javascript:"]'),
  ).not.toBeInTheDocument();
  expect(screen.getByText('Click here')).toBeInTheDocument();
  expect(screen.getByText('Bad link')).not.toHaveAttribute('href');
  expect(screen.getByText('the show')).toHaveAttribute(
    'href',
    'https://example.com/notes',
  );
  expect(screen.getByText('the show')).toHaveAttribute('rel', FEED_LINK_REL);
  expect(Reflect.get(window, 'isFeedScriptRun')).toBeUndefined();
}

describe('EpisodePage', () => {
  beforeEach(() => {
    vi.mocked(fetchPodcastEpisodeChapters).mockReset();
    vi.mocked(fetchPodcastEpisodeTranscript).mockReset();
  });

  describe('chapters', () => {
    it('should turn on the chapters query for an episode with a chapters URL and no `dateCrawled`', async () => {
      vi.mocked(fetchPodcastEpisodeChapters).mockResolvedValue([
        { startTime: 0, title: 'Introduction' },
      ]);

      renderEpisodePage({
        ...EPISODE,
        chaptersUrl: 'https://example.com/chapters.json',
      });

      await waitFor(() =>
        expect(fetchPodcastEpisodeChapters).toHaveBeenCalledWith(
          'https://example.com/chapters.json',
        ),
      );
      expect((await screen.findAllByText('Introduction'))[0]).toBeVisible();
    });

    it('should not request chapters for an episode with no chapters URL', () => {
      renderEpisodePage(EPISODE);

      expect(screen.queryByText('Chapters')).not.toBeInTheDocument();
      expect(fetchPodcastEpisodeChapters).not.toHaveBeenCalled();
    });
  });

  describe('transcripts', () => {
    it('should fetch its own transcript for each of two episodes with the same transcript count and duration', async () => {
      vi.mocked(fetchPodcastEpisodeTranscript).mockImplementation(
        async ({ url }) => ({
          content: `<p>Transcript from ${new URL(url).pathname}</p>`,
          type: 'text/html',
        }),
      );

      const { rerenderEpisode } = renderEpisodePage({
        ...EPISODE,
        identity: 'episode-a',
        transcripts: [
          { type: 'text/html', url: 'https://example.com/a/transcript.html' },
        ],
      });

      expect(
        await screen.findByText('Transcript from /a/transcript.html'),
      ).toBeInTheDocument();

      rerenderEpisode({
        ...EPISODE,
        identity: 'episode-b',
        transcripts: [
          { type: 'text/html', url: 'https://example.com/b/transcript.html' },
        ],
      });

      expect(
        await screen.findByText('Transcript from /b/transcript.html'),
      ).toBeInTheDocument();
      expect(fetchPodcastEpisodeTranscript).toHaveBeenCalledTimes(2);
    });

    it('should request the transcript of the most capable supported type', async () => {
      vi.mocked(fetchPodcastEpisodeTranscript).mockResolvedValue({
        content: [],
        type: 'text/vtt',
      });

      renderEpisodePage({
        ...EPISODE,
        transcripts: [
          { type: 'application/json', url: 'https://example.com/t.json' },
          { type: 'text/html', url: 'https://example.com/t.html' },
          { type: 'text/vtt', url: 'https://example.com/t.vtt' },
        ],
      });

      await waitFor(() =>
        expect(fetchPodcastEpisodeTranscript).toHaveBeenCalledWith(
          { type: 'text/vtt', url: 'https://example.com/t.vtt' },
          1800,
        ),
      );
    });

    it('should show that the transcript type is not supported, with no request', () => {
      renderEpisodePage({
        ...EPISODE,
        transcripts: [
          { type: 'application/json', url: 'https://example.com/t.json' },
        ],
      });

      expect(
        screen.getByText('Transcript type not supported'),
      ).toBeInTheDocument();
      expect(fetchPodcastEpisodeTranscript).not.toHaveBeenCalled();
    });
  });

  describe('feed HTML', () => {
    it('should render no script, no event handler, and no `javascript:` link from a description', () => {
      const { container } = renderEpisodePage({
        ...EPISODE,
        description: UNSAFE_FEED_HTML,
      });

      expectNoUnsafeFeedHtml(container);
    });

    it('should render no script, no event handler, and no `javascript:` link from an HTML transcript', async () => {
      vi.mocked(fetchPodcastEpisodeTranscript).mockResolvedValue({
        content: UNSAFE_FEED_HTML,
        type: 'text/html',
      });

      const { container } = renderEpisodePage({
        ...EPISODE,
        transcripts: [
          { type: 'text/html', url: 'https://example.com/transcript.html' },
        ],
      });

      expect(await screen.findByText('Click here')).toBeInTheDocument();
      expectNoUnsafeFeedHtml(container);
    });

    it('should render a Markdown link of a description with `rel="nofollow ugc"`', () => {
      renderEpisodePage({
        ...EPISODE,
        description: 'Read [the notes](https://example.com/notes).',
      });

      expect(screen.getByText('the notes')).toHaveAttribute(
        'rel',
        FEED_LINK_REL,
      );
    });
  });

  describe('absent fields', () => {
    it('should show no description and no publish date for an episode without them', () => {
      renderEpisodePage({ ...EPISODE, description: undefined });

      expect(screen.queryByText('Description')).not.toBeInTheDocument();
      expect(screen.queryByText(/^Published on/)).not.toBeInTheDocument();
    });

    it('should show the publish date of an episode that has one', () => {
      renderEpisodePage({ ...EPISODE, datePublished: 1_760_000_000 });

      expect(screen.getByText(/^Published on/)).toBeInTheDocument();
    });
  });

  describe('start time prompt', () => {
    let originalHistoryState: unknown;
    let originalUrl: string;

    beforeEach(async () => {
      await deleteDatabase();
      originalHistoryState = window.history.state;
      originalUrl = window.location.href;
    });

    afterEach(() => {
      window.history.replaceState(originalHistoryState, '', originalUrl);
    });

    it('should ask to play from a valid `t` above the play button', async () => {
      renderEpisodePageWithPlayer({ t: '754' });

      const prompt = await screen.findByRole('region', {
        name: 'Start Listening at 12:34?',
      });

      expect(prompt).toBeVisible();
      expect(screen.getByText('Play from 12:34')).toBeVisible();
      expect(screen.getByText('Not Now')).toBeVisible();
      expect(
        prompt.compareDocumentPosition(screen.getByLabelText('Play podcast')) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });

    it('should start the episode at the time of `t` on a click of "Play from" (AE3)', async () => {
      const { result } = await renderHydratedEpisodePageWithPlayer({
        t: '754',
      });

      fireEvent.click(await screen.findByText('Play from 12:34'));

      await waitFor(() =>
        expect(result.current.media.episodeIdentity).toBe(EPISODE.identity),
      );
      expect(result.current.media.feedUrl).toBe(EPISODE.feedUrl);
      expect(result.current.media.src).toBe(EPISODE.enclosureUrl);
      expect(result.current.media.currentTime).toBe(754);
      expect(result.current.media.isPaused).toBe(false);
      expect(queryPrompt()).not.toBeInTheDocument();
    });

    it('should hide the prompt on a click of "Not Now", with no playback (AE4)', async () => {
      const { result } = await renderHydratedEpisodePageWithPlayer({
        t: '754',
      });

      fireEvent.click(await screen.findByText('Not Now'));

      expect(queryPrompt()).not.toBeInTheDocument();
      expect(result.current.media.episodeIdentity).toBeNull();
      expect(result.current.media.src).toBeNull();
      expect(result.current.media.isPaused).toBe(true);
    });

    it('should resume from the saved position after "Not Now" when hydration ends after mount (AE4)', async () => {
      await seedSettings({ currentTime: 2412 });

      const { result } = renderEpisodePageWithPlayer({ t: '754' });

      expect(result.current.settings.isDoneHydratingFromIdb).toBe(false);

      await waitFor(() =>
        expect(result.current.settings.isDoneHydratingFromIdb).toBe(true),
      );
      fireEvent.click(await screen.findByText('Not Now'));
      fireEvent.click(screen.getByLabelText('Play podcast'));

      await waitFor(() =>
        expect(result.current.media.episodeIdentity).toBe(EPISODE.identity),
      );
      expect(result.current.media.currentTime).toBe(2412);
      expect(result.current.media.isPaused).toBe(false);
    });

    it('should resume an episode in the player from the saved position after "Not Now" (AE4)', async () => {
      await seedSettings({ currentTime: 2412, isInThePlayer: true });

      const { result } = renderEpisodePageWithPlayer({ t: '754' });

      await waitFor(() =>
        expect(result.current.media.episodeIdentity).toBe(EPISODE.identity),
      );
      fireEvent.click(await screen.findByText('Not Now'));
      fireEvent.click(screen.getByLabelText('Play podcast'));

      await waitFor(() => expect(result.current.media.isPaused).toBe(false));
      expect(result.current.media.currentTime).toBe(2412);
    });

    it('should remove `t` from the URL after "Play from", so that a reload shows no prompt', async () => {
      setUrlStartTime('754');

      const { unmount } = await renderHydratedEpisodePageWithPlayer({
        t: '754',
      });

      fireEvent.click(await screen.findByText('Play from 12:34'));

      expect(getUrlStartTime()).toBeNull();

      unmount();
      renderEpisodePageWithPlayer({ t: getUrlStartTime() ?? undefined });

      expect(screen.getByLabelText('Play podcast')).toBeVisible();
      expect(queryPrompt()).not.toBeInTheDocument();
    });

    it('should remove `t` from the URL after "Not Now", so that a reload shows no prompt', async () => {
      setUrlStartTime('754');

      const { unmount } = await renderHydratedEpisodePageWithPlayer({
        t: '754',
      });

      fireEvent.click(await screen.findByText('Not Now'));

      expect(getUrlStartTime()).toBeNull();

      unmount();
      renderEpisodePageWithPlayer({ t: getUrlStartTime() ?? undefined });

      expect(screen.getByLabelText('Play podcast')).toBeVisible();
      expect(queryPrompt()).not.toBeInTheDocument();
    });

    it('should show the floor of a decimal `t`', async () => {
      renderEpisodePageWithPlayer({ t: '90.9' });

      expect(await screen.findByText('Play from 1:30')).toBeVisible();
    });

    it('should start the saved position and hide the prompt on a click of the play button', async () => {
      await seedSettings({ currentTime: 2412 });
      setUrlStartTime('754');

      const { result } = await renderHydratedEpisodePageWithPlayer({
        t: '754',
      });

      expect(await screen.findByText('Play from 12:34')).toBeVisible();

      fireEvent.click(screen.getByLabelText('Play podcast'));

      await waitFor(() =>
        expect(result.current.media.episodeIdentity).toBe(EPISODE.identity),
      );
      expect(result.current.media.currentTime).toBe(2412);
      expect(queryPrompt()).not.toBeInTheDocument();
      expect(getUrlStartTime()).toBeNull();
    });

    it('should show no prompt for a `t` at or after the end of the episode (AE5)', () => {
      renderEpisodePageWithPlayer({ t: '2700' });

      expect(screen.getByLabelText('Play podcast')).toBeVisible();
      expect(queryPrompt()).not.toBeInTheDocument();
    });

    it.each(['0', 'abc', '90000'])(
      'should show no prompt for a `t` of %s for an episode with no known duration',
      (t) => {
        renderEpisodePageWithPlayer({
          episode: { ...EPISODE, duration: undefined },
          t,
        });

        expect(screen.getByLabelText('Play podcast')).toBeVisible();
        expect(queryPrompt()).not.toBeInTheDocument();
      },
    );

    it('should show the prompt for a `t` of 90 for an episode with no known duration', async () => {
      renderEpisodePageWithPlayer({
        episode: { ...EPISODE, duration: undefined },
        t: '90',
      });

      expect(await screen.findByText('Play from 1:30')).toBeVisible();
    });

    it('should show no prompt for an episode with no enclosure URL', () => {
      renderEpisodePageWithPlayer({
        episode: { ...EPISODE, enclosureUrl: undefined },
        t: '754',
      });

      expect(queryPrompt()).not.toBeInTheDocument();
    });

    it('should seek a loaded and paused episode to the time of `t`, and play it', async () => {
      await seedSettings({ currentTime: 300, isInThePlayer: true });

      const { result } = renderEpisodePageWithPlayer({ t: '90' });

      await waitFor(() => expect(result.current.media.currentTime).toBe(300));

      const audioElement = document.createElement('audio');

      vi.spyOn(audioElement, 'play').mockResolvedValue(undefined);
      result.current.media.audioRef.current = audioElement;

      fireEvent.click(await screen.findByText('Play from 1:30'));

      await waitFor(() => expect(result.current.media.isPaused).toBe(false));
      expect(result.current.media.currentTime).toBe(90);
      expect(audioElement.currentTime).toBe(90);
      expect(audioElement.play).toHaveBeenCalledOnce();
    });

    it('should show the prompt again with the new time when `t` changes after "Not Now"', async () => {
      const { rerenderWithStartTime } = renderEpisodePageWithPlayer({
        t: '10',
      });

      fireEvent.click(await screen.findByText('Not Now'));

      expect(queryPrompt()).not.toBeInTheDocument();

      rerenderWithStartTime('20');

      expect(
        await screen.findByRole('region', {
          name: 'Start Listening at 0:20?',
        }),
      ).toBeVisible();
      expect(screen.getByText('Play from 0:20')).toBeVisible();
    });
  });

  describe('people', () => {
    it('should list hosts first, and give a person with no role the host role', () => {
      renderEpisodePage({
        ...EPISODE,
        persons: [
          { name: 'Guest Person', role: 'guest' },
          { name: 'Host Person' },
        ],
      });

      const names = Array.from(document.querySelectorAll('h5'), (heading) =>
        heading.textContent?.trim(),
      );

      expect(names).toEqual(['Host Person', 'Guest Person']);
      expect(screen.getByText('Host')).toBeInTheDocument();
      expect(screen.getByText('Guest')).toBeInTheDocument();
    });
  });
});
