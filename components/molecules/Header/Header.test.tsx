import { render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import type { ComponentProps } from 'react';
import { commands, userEvent } from 'vitest/browser';

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

    it('should animate the logo with the logo animation', () => {
      const element = renderHeader('/');
      const animations = element?.querySelector('svg')?.getAnimations();

      expect(animations).toHaveLength(1);
      expect((animations?.[0] as CSSAnimation).animationName).toBe('logo');
      expect(animations?.[0]?.playState).toBe('running');
    });
  });

  describe('static page', () => {
    it('should render the logo and the name of the page', async () => {
      const element = renderHeader('/about');
      await expect(element).toMatchScreenshot('header-static-page.png');
    });

    it('should show no crumb for a path that is not a static page', () => {
      renderHeader('/settings');

      expect(screen.queryByText('/')).toBeNull();
      expect(screen.queryByText('Settings')).toBeNull();
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

    it('should shrink the title of the episode to fit the row', () => {
      const element = renderHeader(
        getEpisodePath({
          episodeIdentity: EPISODE.identity,
          feedUrl: FEED_URL,
        }),
        { episode: EPISODE },
      );
      const title = screen.getByRole('heading', { level: 3 });

      expect(title.getBoundingClientRect().right).toBeLessThanOrEqual(
        element?.getBoundingClientRect().right ?? 0,
      );
    });
  });

  describe('trim', () => {
    it('should keep the full line box of the home heading', () => {
      renderHeader('/');

      expect(screen.getByRole('heading', { level: 1 })).toHaveStyle({
        textBoxTrim: 'none',
      });
    });

    it('should trim the slash and the name of the page on a static page', () => {
      const element = renderHeader('/about');
      const texts = Array.from(
        element?.querySelectorAll(':scope > :not(h1)') ?? [],
      );

      expect(texts).toHaveLength(2);

      for (const text of texts) {
        expect(text).toHaveStyle({ textBoxTrim: 'trim-both' });
      }
    });

    it('should trim the slashes and the titles on the page of an episode', () => {
      const element = renderHeader(
        getEpisodePath({
          episodeIdentity: EPISODE.identity,
          feedUrl: FEED_URL,
        }),
        { episode: EPISODE },
      );
      const texts = Array.from(
        element?.querySelectorAll(':scope > :not(h1)') ?? [],
      );

      expect(texts).toHaveLength(4);

      for (const text of texts) {
        expect(text).toHaveStyle({ textBoxTrim: 'trim-both' });
      }
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

  describe('hover', () => {
    // The pointer stays where the last hover put it, and a later screenshot
    // can show a hover underline. The top-left corner of the page has no link.
    afterEach(async () => {
      await userEvent.hover(document.body, { position: { x: 0, y: 0 } });
    });

    it('should underline the name of the page on hover', async () => {
      renderHeader('/about');
      const link = screen.getByRole('link', { name: 'About' });

      expect(link).toHaveStyle({ textDecorationLine: 'none' });

      await userEvent.hover(link);

      expect(link).toHaveStyle({ textDecorationLine: 'underline' });
    });

    it('should underline the title of the show on hover', async () => {
      renderHeader(getPodcastPath({ feedUrl: FEED_URL }), { feed: FEED });
      const link = screen.getByRole('link', { name: 'Example Show' });

      expect(link).toHaveStyle({ textDecorationLine: 'none' });

      await userEvent.hover(link);

      expect(link).toHaveStyle({ textDecorationLine: 'underline' });
    });

    it('should underline the short title of the show on hover', async () => {
      renderHeader(
        getEpisodePath({
          episodeIdentity: EPISODE.identity,
          feedUrl: FEED_URL,
        }),
        { episode: EPISODE },
      );
      const link = screen.getByRole('link', { name: 'ES' });

      expect(link).toHaveStyle({ textDecorationLine: 'none' });

      await userEvent.hover(link);

      expect(link).toHaveStyle({ textDecorationLine: 'underline' });
    });

    it('should underline the title of the episode on hover', async () => {
      renderHeader(
        getEpisodePath({
          episodeIdentity: EPISODE.identity,
          feedUrl: FEED_URL,
        }),
        { episode: EPISODE },
      );
      const link = screen.getByRole('link', { name: EPISODE.title });

      expect(link).toHaveStyle({ textDecorationLine: 'none' });

      // The ellipsis clips the link, so the center of the link is not visible.
      await userEvent.hover(link, { position: { x: 8, y: 8 } });

      expect(link).toHaveStyle({ textDecorationLine: 'underline' });
    });

    it('should not underline the logo link on hover', async () => {
      renderHeader('/');
      const link = screen.getByRole('link', { name: 'Pod Monster' });

      await userEvent.hover(link);

      expect(link).toHaveStyle({ textDecorationLine: 'none' });
    });
  });

  describe('className', () => {
    it('should apply a custom className to the root', () => {
      const element = renderHeader('/', { className: 'custom-class' });

      expect(element).toHaveClass('custom-class');
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
