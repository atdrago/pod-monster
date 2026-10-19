import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';

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
