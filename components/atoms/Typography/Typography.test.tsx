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

// The ascent of "H" in the font of the element is its cap height.
function getCapHeight(element: Element) {
  const context = document.createElement('canvas').getContext('2d');

  if (context === null) {
    throw new Error('The canvas has no 2D context.');
  }

  context.font = getComputedStyle(element).font;

  return context.measureText('H').actualBoundingBoxAscent;
}

function getHeight(element: Element) {
  return element.getBoundingClientRect().height;
}

describe('Typography', () => {
  describe('sizes', () => {
    it.each([
      ['legal', '12px', '18px'],
      ['paragraph', '16px', '24px'],
      ['headingSmaller', '18px', '27px'],
      ['headingSmall', '20px', '24px'],
      ['headingMedium', '24px', '28.8px'],
      ['headingLarge', '28px', '33.6px'],
      ['monospace', '12px', '15.6px'],
    ] as const)(
      'should render the %s size with the token size and leading',
      (size, fontSize, lineHeight) => {
        render(
          <Typography as="p" size={size}>
            Sized text
          </Typography>,
        );
        expect(screen.getByText('Sized text')).toHaveStyle({
          fontSize,
          lineHeight,
        });
      },
    );

    it('should not limit the width of the monospace size', () => {
      render(
        <Typography as="p" size="monospace">
          Monospace text
        </Typography>,
      );
      expect(screen.getByText('Monospace text')).toHaveStyle({
        maxWidth: 'none',
      });
    });

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

  describe('trim', () => {
    it('should trim a block root from the cap height to the baseline', () => {
      render(
        <Typography as="p" size="paragraph">
          Trimmed text
        </Typography>,
      );
      const element = screen.getByText('Trimmed text');
      expect(getHeight(element)).toBeCloseTo(getCapHeight(element), 0);
    });

    it('should keep the full line box of a block root without the trim', () => {
      render(
        <Typography as="p" size="paragraph" shouldTrimTextBox={false}>
          Untrimmed text
        </Typography>,
      );
      expect(getHeight(screen.getByText('Untrimmed text'))).toBe(24);
    });

    it('should trim a flex-item root from the cap height to the baseline', () => {
      render(
        <div className="flex">
          <Typography as="span" size="paragraph">
            Flex item text
          </Typography>
        </div>,
      );
      const element = screen.getByText('Flex item text');
      expect(getHeight(element)).toBeCloseTo(getCapHeight(element), 0);
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

    it('should render a trimmed link root in a flex list item as a block', () => {
      render(
        <ul className="flex list-none">
          <li>
            <Typography as={Link} href="/about" size="paragraph">
              About
            </Typography>
          </li>
        </ul>,
      );
      const element = screen.getByText('About');
      expect(element).toHaveStyle({ display: 'block' });
      expect(getHeight(element)).toBeCloseTo(getCapHeight(element), 0);
    });

    it('should render a trimmed span root under a leading-0 parent as a block', () => {
      render(
        <div className="leading-0">
          <Typography as="span" size="paragraph">
            Inline text
          </Typography>
        </div>,
      );
      const element = screen.getByText('Inline text');
      expect(element).toHaveStyle({ display: 'block' });
      expect(getHeight(element)).toBeCloseTo(getCapHeight(element), 0);
    });

    it('should keep an untrimmed span root inline', () => {
      render(
        <Typography as="span" size="paragraph" shouldTrimTextBox={false}>
          Inline text
        </Typography>,
      );
      expect(screen.getByText('Inline text')).toHaveStyle({
        display: 'inline',
      });
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
          shouldTrimTextBox={false}
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

    // The padding of the wrapper puts the descenders inside the screenshot.
    it('should keep the descenders of a truncated title with the trim', async () => {
      const { container } = render(
        <div className="py-2">
          <Typography
            as="h2"
            className="font-bold"
            size="headingSmaller"
            whitespace="ellipsis"
          >
            {ELLIPSIS_TITLE}
          </Typography>
        </div>,
      );
      const element = container.firstElementChild;
      await expect(element).toMatchScreenshot(
        'typography-whitespace-ellipsis-descenders.png',
      );
    });

    it('should keep the descenders of a truncated title without the trim', async () => {
      const { container } = render(
        <div className="py-2">
          <Typography
            as="h2"
            className="font-bold"
            shouldTrimTextBox={false}
            size="headingSmaller"
            whitespace="ellipsis"
          >
            {ELLIPSIS_TITLE}
          </Typography>
        </div>,
      );
      const element = container.firstElementChild;
      await expect(element).toMatchScreenshot(
        'typography-whitespace-ellipsis-descenders-noTrim.png',
      );
    });

    it('should shrink a truncated title without the trim in a grid column', () => {
      render(
        <div className="grid w-[300px] grid-cols-[max-content_1fr_max-content]">
          <span>0:00</span>
          <Typography
            as="h4"
            shouldTrimTextBox={false}
            size="paragraph"
            whitespace="ellipsis"
          >
            {ELLIPSIS_TITLE}
          </Typography>
          <span>0:03</span>
        </div>,
      );
      expect(
        screen.getByRole('heading').getBoundingClientRect().right,
      ).toBeLessThanOrEqual(300);
    });

    it('should clamp a three-line text to two lines without the trim', () => {
      render(
        <Typography
          as="h2"
          className="font-bold"
          shouldTrimTextBox={false}
          size="headingSmaller"
          whitespace={2}
        >
          {THREE_LINE_TITLE}
        </Typography>,
      );
      expect(getHeight(screen.getByRole('heading'))).toBe(2 * 27);
    });
  });

  describe('shouldTrimTextBox', () => {
    it('should render paragraph size without the trim', async () => {
      const { container } = render(
        <Typography as="p" size="paragraph" shouldTrimTextBox={false}>
          {PARAGRAPH_TEXT}
        </Typography>,
      );
      const element = container.querySelector('p');
      await expect(element).toMatchScreenshot(
        'typography-paragraph-noTrim.png',
      );
    });

    it('should render no trim and no inner span for normal whitespace', () => {
      render(
        <Typography as="p" size="paragraph" shouldTrimTextBox={false}>
          Untrimmed text
        </Typography>,
      );
      const element = screen.getByText('Untrimmed text');
      expect(element).not.toHaveClass('text-box-trim-cap');
      expect(element).toHaveStyle({ textBoxTrim: 'none' });
      expect(element.children).toHaveLength(0);
    });

    it('should render the trim and no inner span for normal whitespace by default', () => {
      render(
        <Typography as="p" size="paragraph">
          Trimmed text
        </Typography>,
      );
      const element = screen.getByText('Trimmed text');
      expect(element).toHaveClass('text-box-trim-cap');
      expect(element.children).toHaveLength(0);
    });
  });

  describe('width', () => {
    it('should center a content-width root by default', () => {
      render(
        <Typography as="p" size="paragraph">
          Centered column
        </Typography>,
      );
      expect(screen.getByText('Centered column')).toHaveClass(
        'mx-auto',
        'w-full',
        'max-w-content',
      );
    });

    it('should render an auto-width root with no width classes', () => {
      render(
        <Typography as="p" size="paragraph" width="auto">
          Auto width
        </Typography>,
      );
      const element = screen.getByText('Auto width');
      expect(element).not.toHaveClass('mx-auto');
      expect(element).not.toHaveClass('w-full');
      expect(element).not.toHaveClass('max-w-content');
      expect(element).not.toHaveAttribute('width');
    });
  });

  describe('className', () => {
    it('should add a custom className to the root', () => {
      render(
        <Typography as="p" className="font-bold" size="paragraph">
          Bold text
        </Typography>,
      );
      const element = screen.getByText('Bold text');
      expect(element).toHaveClass('font-bold');
      expect(element).toHaveStyle({ fontWeight: '700' });
    });
  });

  describe('polymorphic', () => {
    it('should render the size class on a label root', () => {
      render(
        <Typography as="label" htmlFor="search" size="paragraph">
          Search
        </Typography>,
      );
      expect(screen.getByText('Search')).toHaveClass('text-paragraph');
    });

    it('should render the size class on a link root', () => {
      render(
        <Typography as={Link} href="/about" size="paragraph">
          About
        </Typography>,
      );
      expect(screen.getByText('About')).toHaveClass('text-paragraph');
    });

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
