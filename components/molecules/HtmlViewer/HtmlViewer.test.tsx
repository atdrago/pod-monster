import { render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import rehypeRaw from 'rehype-raw';
import { commands, page } from 'vitest/browser';

import { HtmlViewer } from './HtmlViewer';

// Markdown has no syntax for `small` or a table. The raw HTML parts need
// `rehype-raw`, as the episode page uses.
const MARKDOWN = `# Heading one

## Heading two

### Heading three

#### Heading four

A paragraph with **strong text**, *emphasis*, and [a link](https://example.com).

- First item
- Second item
  - Nested item
- Third item

1. First step
2. Second step

> A quote from the episode.

![Pod Monster logo](/favicon-32x32.png)

\`\`\`
const episode = 1;
\`\`\`

<small>Small print</small>

---

<table>
<thead><tr><th>Name</th><th>Role</th></tr></thead>
<tbody><tr><td>Alex</td><td>Host</td></tr></tbody>
</table>
`;

async function renderHtmlViewer(
  props: Partial<ComponentProps<typeof HtmlViewer>> = {},
) {
  const rendered = render(
    <HtmlViewer rehypePlugins={[rehypeRaw]} {...props}>
      {MARKDOWN}
    </HtmlViewer>,
  );

  await screen.getByAltText<HTMLImageElement>('Pod Monster logo').decode();

  return rendered;
}

describe('HtmlViewer', () => {
  describe('shouldTrimTextBox', () => {
    it('should render each element with the trim by default', async () => {
      const { container } = await renderHtmlViewer();
      const element = container.firstElementChild;
      await expect(element).toMatchScreenshot('htmlViewer-trim-on.png');
    });

    it('should render each element without the trim', async () => {
      const { container } = await renderHtmlViewer({
        shouldTrimTextBox: false,
      });
      const element = container.firstElementChild;
      await expect(element).toMatchScreenshot('htmlViewer-trim-off.png');
    });
  });

  describe('lists', () => {
    it('should render each list item with its full line box', async () => {
      await renderHtmlViewer();

      const first = screen.getByText('First item').getBoundingClientRect();
      const second = screen.getByText('Second item').getBoundingClientRect();

      expect(first.height).toBe(24);
      expect(second.top - first.top).toBe(24);
    });

    it('should show bullets on each unordered list with a 24px indent', async () => {
      await renderHtmlViewer();

      const list = screen.getByText('First item').closest('ul');
      const nestedList = screen.getByText('Nested item').closest('ul');

      expect(nestedList).not.toBe(list);
      expect(list).toHaveStyle({ listStyleType: 'disc', paddingLeft: '24px' });
      expect(nestedList).toHaveStyle({
        listStyleType: 'disc',
        paddingLeft: '24px',
      });
    });

    it('should show numbers on an ordered list with a 24px indent', async () => {
      await renderHtmlViewer();

      expect(screen.getByText('First step').closest('ol')).toHaveStyle({
        listStyleType: 'decimal',
        paddingLeft: '24px',
      });
    });
  });

  describe('images', () => {
    it('should render an image no wider than its container', async () => {
      const { container } = render(
        <HtmlViewer rehypePlugins={[rehypeRaw]}>
          {
            '<img alt="Large logo" src="/android-chrome-512x512.png" width="512" height="512">'
          }
        </HtmlViewer>,
      );
      const image = screen.getByAltText<HTMLImageElement>('Large logo');
      await image.decode();

      const imageBox = image.getBoundingClientRect();
      const rootBox = container.firstElementChild!.getBoundingClientRect();

      expect(imageBox.width).toBeLessThan(512);
      expect(imageBox.width).toBeLessThanOrEqual(rootBox.width);
      expect(imageBox.height).toBe(imageBox.width);
    });
  });

  describe('links', () => {
    it('should underline a link and open it in a new tab', async () => {
      await renderHtmlViewer();

      const link = screen.getByRole('link', { name: 'a link' });

      expect(link).toHaveStyle({ textDecorationLine: 'underline' });
      expect(link).toHaveAttribute('href', 'https://example.com');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noreferrer noopener');
    });
  });

  describe('className', () => {
    it('should apply a custom className to the root', async () => {
      const { container } = await renderHtmlViewer({
        className: 'custom-class',
      });

      expect(container.firstElementChild).toHaveClass('custom-class');
    });
  });

  describe('dark', () => {
    beforeAll(async () => {
      await commands.setColorScheme('dark');
    });

    afterAll(async () => {
      await commands.setColorScheme('light');
    });

    it('should render each element with the trim by default', async () => {
      const { container } = await renderHtmlViewer();
      const element = container.firstElementChild;
      await expect(element).toMatchScreenshot('htmlViewer-trim-on-dark.png');
    });
  });

  describe('wide', () => {
    beforeAll(async () => {
      await page.viewport(1024, 768);
    });

    afterAll(async () => {
      await page.viewport(414, 896);
    });

    it('should render each element without the trim', async () => {
      const { container } = await renderHtmlViewer({
        shouldTrimTextBox: false,
      });
      const element = container.firstElementChild;
      await expect(element).toMatchScreenshot('htmlViewer-trim-off-wide.png');
    });
  });
});
