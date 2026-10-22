import { render, screen } from '@testing-library/react';
import Link from 'next/link';
import { commands, page } from 'vitest/browser';

import { Typography } from './Typography';

const PARAGRAPH_TEXT =
  'Enjoy a quick podcast player that gives you the chapters, transcripts, and episodes of every show.';
const ELLIPSIS_TITLE =
  'The gjpqy Weekly Show: A Very Long Podcast Title That Does Not Fit On One Line';
const THREE_LINE_TITLE =
  'A podcast with a very long title that wraps onto a second line, then onto a third line, and the clamp hides the third line';

describe('Typography', () => {
  describe('sizes', () => {
    it('should render headingLarge size', async () => {
      const { container } = render(
        <Typography as="p" size="headingLarge">
          {PARAGRAPH_TEXT}
        </Typography>,
      );
      const element = container.querySelector('p');
      await expect(element).toMatchScreenshot(
        'typography-size-headingLarge.png',
      );
    });

    it('should render headingMedium size', async () => {
      const { container } = render(
        <Typography as="p" size="headingMedium">
          {PARAGRAPH_TEXT}
        </Typography>,
      );
      const element = container.querySelector('p');
      await expect(element).toMatchScreenshot(
        'typography-size-headingMedium.png',
      );
    });

    it('should render headingSmall size', async () => {
      const { container } = render(
        <Typography as="p" size="headingSmall">
          {PARAGRAPH_TEXT}
        </Typography>,
      );
      const element = container.querySelector('p');
      await expect(element).toMatchScreenshot(
        'typography-size-headingSmall.png',
      );
    });

    it('should render headingSmaller size', async () => {
      const { container } = render(
        <Typography as="p" size="headingSmaller">
          {PARAGRAPH_TEXT}
        </Typography>,
      );
      const element = container.querySelector('p');
      await expect(element).toMatchScreenshot(
        'typography-size-headingSmaller.png',
      );
    });

    it('should render legal size', async () => {
      const { container } = render(
        <Typography as="p" size="legal">
          {PARAGRAPH_TEXT}
        </Typography>,
      );
      const element = container.querySelector('p');
      await expect(element).toMatchScreenshot('typography-size-legal.png');
    });

    it('should render monospace size', async () => {
      const { container } = render(
        <Typography as="p" size="monospace">
          {PARAGRAPH_TEXT}
        </Typography>,
      );
      const element = container.querySelector('p');
      await expect(element).toMatchScreenshot('typography-size-monospace.png');
    });

    it('should render paragraph size', async () => {
      const { container } = render(
        <Typography as="p" size="paragraph">
          {PARAGRAPH_TEXT}
        </Typography>,
      );
      const element = container.querySelector('p');
      await expect(element).toMatchScreenshot('typography-size-paragraph.png');
    });
  });

  describe('textAlign', () => {
    it('should align the text to the center', async () => {
      const { container } = render(
        <Typography as="p" size="paragraph" textAlign="center">
          Centered text
        </Typography>,
      );
      const element = container.querySelector('p');
      await expect(element).toMatchScreenshot(
        'typography-textAlign-center.png',
      );
    });

    it('should align the text to the right', async () => {
      const { container } = render(
        <Typography as="p" size="paragraph" textAlign="right">
          Right-aligned text
        </Typography>,
      );
      const element = container.querySelector('p');
      await expect(element).toMatchScreenshot('typography-textAlign-right.png');
    });
  });

  describe('layout contexts', () => {
    it('should render a root that is a flex item', async () => {
      const { container } = render(
        <div className="flex">
          <Typography as="span" size="paragraph">
            Flex item text
          </Typography>
        </div>,
      );
      const element = container.querySelector('div');
      await expect(element).toMatchScreenshot('typography-flexItem.png');
    });

    it('should render a link root in a flex list item', async () => {
      const { container } = render(
        <ul className="flex list-none">
          <li>
            <Typography as={Link} href="/about" size="paragraph">
              About
            </Typography>
          </li>
        </ul>,
      );
      const element = container.querySelector('li');
      await expect(element).toMatchScreenshot(
        'typography-link-in-flexListItem.png',
      );
    });

    it('should render a span root under a leading-0 parent', async () => {
      const { container } = render(
        <div className="leading-0">
          <Typography as="span" size="paragraph">
            Inline text under a parent with no line height
          </Typography>
        </div>,
      );
      const element = container.querySelector('div');
      await expect(element).toMatchScreenshot(
        'typography-span-in-leading0Parent.png',
      );
    });
  });

  describe('whitespace', () => {
    it('should truncate a long title with an ellipsis', async () => {
      const { container } = render(
        <Typography
          as="h2"
          className="font-bold"
          size="headingSmaller"
          whitespace="ellipsis"
        >
          {ELLIPSIS_TITLE}
        </Typography>,
      );
      const element = container.querySelector('h2');
      await expect(element).toMatchScreenshot(
        'typography-whitespace-ellipsis.png',
      );
    });

    it('should clamp a three-line text to two lines', async () => {
      const { container } = render(
        <Typography
          as="h2"
          className="font-bold"
          size="headingSmaller"
          whitespace={2}
        >
          {THREE_LINE_TITLE}
        </Typography>,
      );
      const element = container.querySelector('h2');
      await expect(element).toMatchScreenshot(
        'typography-whitespace-lineClamp2.png',
      );
    });
  });

  describe('shouldUseCapsize', () => {
    it('should render paragraph size without capsize', async () => {
      const { container } = render(
        <Typography as="p" size="paragraph" shouldUseCapsize={false}>
          {PARAGRAPH_TEXT}
        </Typography>,
      );
      const element = container.querySelector('p');
      await expect(element).toMatchScreenshot(
        'typography-paragraph-noCapsize.png',
      );
    });
  });

  describe('polymorphic', () => {
    it('should render as label element', async () => {
      const { container } = render(
        <Typography as="label" htmlFor="search" size="paragraph">
          Search
        </Typography>,
      );
      const element = container.querySelector('label');
      await expect(element).toMatchScreenshot('typography-as-label.png');
    });

    it('should render as link', async () => {
      const { container } = render(
        <Typography as={Link} href="/about" size="paragraph">
          About
        </Typography>,
      );
      const element = container.querySelector('a');
      expect(screen.getByText('About')).toHaveAttribute('href', '/about');
      await expect(element).toMatchScreenshot('typography-as-link.png');
    });
  });

  describe('dark', () => {
    beforeAll(async () => {
      await commands.setColorScheme('dark');
    });

    afterAll(async () => {
      await commands.setColorScheme('light');
    });

    it('should render paragraph size', async () => {
      const { container } = render(
        <Typography as="p" size="paragraph">
          {PARAGRAPH_TEXT}
        </Typography>,
      );
      const element = container.querySelector('p');
      await expect(element).toMatchScreenshot(
        'typography-size-paragraph-dark.png',
      );
    });
  });

  describe('wide', () => {
    beforeAll(async () => {
      await page.viewport(1024, 768);
    });

    afterAll(async () => {
      await page.viewport(414, 896);
    });

    it('should render paragraph size', async () => {
      const { container } = render(
        <Typography as="p" size="paragraph">
          {PARAGRAPH_TEXT} {PARAGRAPH_TEXT}
        </Typography>,
      );
      const element = container.querySelector('p');
      await expect(element).toMatchScreenshot(
        'typography-size-paragraph-wide.png',
      );
    });
  });
});
