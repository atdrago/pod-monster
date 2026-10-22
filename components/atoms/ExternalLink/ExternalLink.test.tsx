import { render, screen } from '@testing-library/react';
import { commands } from 'vitest/browser';

import { ExternalLink } from './ExternalLink';

describe('ExternalLink', () => {
  it('should render default link', async () => {
    const { container } = render(
      <ExternalLink href="https://podcastindex.org/">
        Podcast Index
      </ExternalLink>,
    );
    const element = container.querySelector('a');
    await expect(element).toMatchScreenshot('externalLink-default.png');
  });

  it('should open the link in a new tab', () => {
    render(
      <ExternalLink href="https://podcastindex.org/">
        Podcast Index
      </ExternalLink>,
    );
    const link = screen.getByText('Podcast Index');
    expect(link).toHaveAttribute('href', 'https://podcastindex.org/');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noreferrer noopener');
  });

  describe('dark', () => {
    beforeAll(async () => {
      await commands.setColorScheme('dark');
    });

    afterAll(async () => {
      await commands.setColorScheme('light');
    });

    it('should render default link', async () => {
      const { container } = render(
        <ExternalLink href="https://podcastindex.org/">
          Podcast Index
        </ExternalLink>,
      );
      const element = container.querySelector('a');
      await expect(element).toMatchScreenshot('externalLink-default-dark.png');
    });
  });
});
