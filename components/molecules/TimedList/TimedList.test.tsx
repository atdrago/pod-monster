import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { commands } from 'vitest/browser';

import { TimedList } from './TimedList';

const TITLE = 'Chapters';
const LIST = [
  { from: 0, text: 'Introduction' },
  { from: 60, text: 'The first topic of the episode' },
  { from: 120, text: 'A question from a listener' },
  { from: 180, text: 'The second topic of the episode' },
  { from: 240, text: 'Closing thoughts' },
];

// The list takes `width="100%"`, so a container with a fixed width sets the
// width of the images.
function renderTimedList(
  props: Partial<ComponentProps<typeof TimedList>> = {},
) {
  return render(
    <div style={{ width: 400 }}>
      <TimedList index={1} list={LIST} title={TITLE} {...props} />
    </div>,
  );
}

async function renderOpenTimedList(
  props: Partial<ComponentProps<typeof TimedList>> = {},
) {
  const rendered = renderTimedList(props);

  fireEvent.click(screen.getByText(TITLE));

  await waitFor(() => expect(screen.getByText('Lock scrolling')).toBeVisible());

  return rendered;
}

describe('TimedList', () => {
  describe('open', () => {
    it('should render five items with the second item current', async () => {
      const { container } = await renderOpenTimedList();
      const element = container.querySelector('details');
      await expect(element).toMatchScreenshot('timedList-open-five-items.png');
    });

    it('should render each row 48px tall', async () => {
      await renderOpenTimedList();

      for (const { text } of LIST) {
        expect(screen.getByText(text).parentElement).toHaveStyle({
          height: '48px',
        });
      }
    });

    it('should render two items in a list box that stays 240px tall', async () => {
      const { container } = await renderOpenTimedList({
        list: LIST.slice(0, 2),
      });
      const element = container.querySelector('details');
      await expect(element).toMatchScreenshot('timedList-open-two-items.png');

      const listBox = screen.getByText(LIST[0].text).parentElement
        ?.parentElement?.parentElement;

      expect(listBox).toHaveStyle({ height: '240px' });
    });
  });

  describe('closed', () => {
    it('should render only the summary', async () => {
      const { container } = renderTimedList();
      const element = container.querySelector('details');
      await expect(element).toMatchScreenshot('timedList-closed.png');
    });
  });

  describe('onIsVisibleAsSubtitleChange', () => {
    it('should render the subtitle checkbox in the footer', async () => {
      const { container } = await renderOpenTimedList({
        isVisibleAsSubtitle: true,
        onIsVisibleAsSubtitleChange: vi.fn(),
      });
      const element = container.querySelector('details');
      await expect(element).toMatchScreenshot('timedList-open-subtitle.png');
    });
  });

  describe('hasError', () => {
    it('should render the error message in place of the list', async () => {
      const { container } = renderTimedList({
        error: new Error('Failed to load chapters'),
        hasError: true,
        list: [],
      });

      fireEvent.click(screen.getByText(TITLE));

      await waitFor(() =>
        expect(screen.getByText('Failed to load chapters')).toBeVisible(),
      );

      const element = container.querySelector('details');
      await expect(element).toMatchScreenshot('timedList-open-error.png');
    });
  });

  describe('dark', () => {
    beforeAll(async () => {
      await commands.setColorScheme('dark');
    });

    afterAll(async () => {
      await commands.setColorScheme('light');
    });

    it('should render five items with the second item current', async () => {
      const { container } = await renderOpenTimedList();
      const element = container.querySelector('details');
      await expect(element).toMatchScreenshot(
        'timedList-open-five-items-dark.png',
      );
    });
  });
});
