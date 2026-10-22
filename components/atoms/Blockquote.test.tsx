import { render } from '@testing-library/react';
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
      await expect(element).toMatchScreenshot('blockquote-default-wide.png');
    });
  });
});
