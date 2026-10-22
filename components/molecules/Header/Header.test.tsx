import { render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import type { ComponentProps } from 'react';
import { commands } from 'vitest/browser';

import { getEpisodePath, getPodcastPath } from 'utils/paths';

import { Header } from './Header';

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}));

const FEED_URL = 'https://example.com/feed.xml';
const FEED = { title: 'Example Show', url: FEED_URL };
const EPISODE = {
  feedTitle: 'Example Show',
  feedUrl: FEED_URL,
  identity: 'episode-1',
  title: 'An episode title that is too long for one line of the header',
};

// The root has a negative top margin. The padding keeps the root in view.
function renderHeader(
  pathname: string,
  props: ComponentProps<typeof Header> = {},
) {
  vi.mocked(usePathname).mockReturnValue(pathname);

  const { container } = render(
    <div style={{ padding: 16 }}>
      <Header {...props} />
    </div>,
  );

  return container.querySelector('header');
}

describe('Header', () => {
  describe('home', () => {
    it('should render the logo and the app name on the home path', async () => {
      const element = renderHeader('/');
      await expect(element).toMatchScreenshot('header-home.png');
    });

    it('should link the logo to the home path', () => {
      renderHeader('/');

      expect(screen.getByRole('link', { name: 'Pod Monster' })).toHaveAttribute(
        'href',
        '/',
      );
    });
  });

  describe('static page', () => {
    it('should render the logo and the name of the page', async () => {
      const element = renderHeader('/settings');
      await expect(element).toMatchScreenshot('header-static-page.png');
    });
  });

  describe('feed', () => {
    it('should render the logo and the title of the show', async () => {
      const element = renderHeader(getPodcastPath({ feedUrl: FEED_URL }), {
        feed: FEED,
      });
      await expect(element).toMatchScreenshot('header-feed.png');
    });
  });

  describe('episode', () => {
    it('should render the short title of the show and the title of the episode', async () => {
      const element = renderHeader(
        getEpisodePath({
          episodeIdentity: EPISODE.identity,
          feedUrl: FEED_URL,
        }),
        { episode: EPISODE },
      );
      await expect(element).toMatchScreenshot('header-episode.png');
    });

    it('should link the short title of the show to the page of the show', () => {
      renderHeader(
        getEpisodePath({
          episodeIdentity: EPISODE.identity,
          feedUrl: FEED_URL,
        }),
        { episode: EPISODE },
      );

      expect(screen.getByRole('link', { name: 'ES' })).toHaveAttribute(
        'href',
        getPodcastPath({ feedUrl: FEED_URL }),
      );
    });
  });

  describe('isLoading', () => {
    it('should render the logo and the loading text', async () => {
      const element = renderHeader(getPodcastPath({ feedUrl: FEED_URL }), {
        isLoading: true,
      });
      await expect(element).toMatchScreenshot('header-loading.png');
    });
  });

  describe('dark', () => {
    beforeAll(async () => {
      await commands.setColorScheme('dark');
    });

    afterAll(async () => {
      await commands.setColorScheme('light');
    });

    it('should render the logo and the app name on the home path', async () => {
      const element = renderHeader('/');
      await expect(element).toMatchScreenshot('header-home-dark.png');
    });
  });
});
