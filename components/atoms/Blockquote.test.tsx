import { render, screen } from '@testing-library/react';
import { commands, page } from 'vitest/browser';

import { Blockquote } from './Blockquote';

const QUOTE_TEXT =
  'Podcasting 2.0 adds chapters, transcripts, and value tags to the open RSS feed, so every app can use them.';

describe('Blockquote', () => {
  it('should render one paragraph', async () => {
    const { container } = render(
      <Blockquote>
        <p>{QUOTE_TEXT}</p>
      </Blockquote>,
    );
    const element = container.querySelector('blockquote');
    await expect(element).toMatchScreenshot('blockquote-default.png');
  });

  describe('legacy sizes', () => {
    it('should pad the quote by 16px on the top, the bottom, and the left', () => {
      render(
        <Blockquote>
          <p>{QUOTE_TEXT}</p>
        </Blockquote>,
      );
      expect(screen.getByText(QUOTE_TEXT).parentElement).toHaveStyle({
        padding: '16px 0px 16px 16px',
      });
    });
  });

  describe('className', () => {
    it('should write no undefined class when no className is given', () => {
      const { container } = render(
        <Blockquote>
          <p>{QUOTE_TEXT}</p>
        </Blockquote>,
      );
      expect(container.querySelector('blockquote')).not.toHaveClass(
        'undefined',
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

    it('should render one paragraph', async () => {
      const { container } = render(
        <Blockquote>
          <p>{QUOTE_TEXT}</p>
        </Blockquote>,
      );
      const element = container.querySelector('blockquote');
      await expect(element).toMatchScreenshot('blockquote-default-dark.png');
    });
  });

  describe('wide', () => {
    beforeAll(async () => {
      await page.viewport(1024, 768);
    });

    afterAll(async () => {
      await page.viewport(414, 896);
    });

    it('should render one paragraph', async () => {
      const { container } = render(
        <Blockquote>
          <p>{QUOTE_TEXT}</p>
        </Blockquote>,
      );
      const element = container.querySelector('blockquote');
      expect(element?.getBoundingClientRect().width).toBe(480);
      await expect(element).toMatchScreenshot('blockquote-default-wide.png');
    });
  });
});
