import { render, screen, waitFor } from '@testing-library/react';
import { commands } from 'vitest/browser';

import { EpisodeList } from './EpisodeList';

// The CI runner and a local Mac can use different locales and time zones. The
// mock pins both, so the date text is the same on each machine.
vi.mock('utils/date', async (importOriginal) => ({
  ...(await importOriginal<typeof import('utils/date')>()),
  longDateTimeFormat: new Intl.DateTimeFormat('en-US', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'UTC',
  }),
}));

const FEED_URL = 'https://example.com/feed.xml';

function solidImage(color: string) {
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="${color}"/></svg>`,
  )}`;
}

const EPISODES: Parameters<typeof EpisodeList>[0]['episodes'] = [
  {
    datePublished: Date.parse('2026-10-10T12:00:00.000Z') / 1000,
    duration: 3600,
    episodeType: 'full',
    explicit: false,
    feedImage: solidImage('#3b82f6'),
    feedUrl: FEED_URL,
    identity: 'episode-1',
    title: 'Episode 1',
  },
  {
    datePublished: Date.parse('2026-10-03T12:00:00.000Z') / 1000,
    duration: 5400,
    episodeType: 'full',
    explicit: false,
    feedImage: solidImage('#3b82f6'),
    feedUrl: FEED_URL,
    identity: 'episode-2',
    image: solidImage('#f97316'),
    title:
      'Episode 2: A very long title that overflows the row, with gjpqy descenders',
  },
  {
    datePublished: Date.parse('2026-09-26T12:00:00.000Z') / 1000,
    duration: 1800,
    episodeType: 'full',
    explicit: true,
    feedImage: solidImage('#3b82f6'),
    feedUrl: FEED_URL,
    identity: 'episode-3',
    title: 'Episode 3',
  },
];

async function renderEpisodeList() {
  const rendered = render(<EpisodeList episodes={EPISODES} />);

  await waitFor(() => {
    rendered.container.querySelectorAll('img').forEach((image) => {
      expect(image.complete).toBe(true);
    });
  });

  return rendered;
}

describe('EpisodeList', () => {
  it('should render three episodes', async () => {
    const { container } = await renderEpisodeList();
    const element = container.firstElementChild;
    await expect(element).toMatchScreenshot('episodeList-default.png');
  });

  it('should not underline the links to the episodes', async () => {
    await renderEpisodeList();
    const links = screen.getAllByRole('link');

    expect(links).toHaveLength(EPISODES.length);
    links.forEach((link) => {
      expect(link).toHaveStyle({ textDecorationLine: 'none' });
    });
  });

  describe('dark', () => {
    beforeAll(async () => {
      await commands.setColorScheme('dark');
    });

    afterAll(async () => {
      await commands.setColorScheme('light');
    });

    it('should render three episodes', async () => {
      const { container } = await renderEpisodeList();
      const element = container.firstElementChild;
      await expect(element).toMatchScreenshot('episodeList-default-dark.png');
    });
  });
});
