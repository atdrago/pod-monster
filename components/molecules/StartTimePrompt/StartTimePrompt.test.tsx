import { fireEvent, render, screen } from '@testing-library/react';
import { commands } from 'vitest/browser';

import { StartTimePrompt } from './StartTimePrompt';

/** Waits for the line, which gets its text after the mount. */
async function renderStartTimePrompt({
  className,
  isPlayFromDisabled,
  startTime = 754,
}: {
  className?: string;
  isPlayFromDisabled?: boolean;
  startTime?: number;
} = {}) {
  const onNotNowClick = vi.fn();
  const onPlayFromClick = vi.fn();
  const rendered = render(
    <StartTimePrompt
      className={className}
      isPlayFromDisabled={isPlayFromDisabled}
      startTime={startTime}
      onNotNowClick={onNotNowClick}
      onPlayFromClick={onPlayFromClick}
    />,
  );

  const line = await screen.findByText(/^Start Listening at /);

  return { ...rendered, line, onNotNowClick, onPlayFromClick };
}

describe('StartTimePrompt', () => {
  it('should render the line and the two buttons with the start time', async () => {
    const { container, line } = await renderStartTimePrompt();

    expect(line).toHaveTextContent('Start Listening at 12:34?');
    expect(line).toBeVisible();
    expect(screen.getByText('Play from 12:34')).toBeVisible();
    expect(screen.getByText('Not Now')).toBeVisible();
    await expect(container.firstElementChild).toMatchScreenshot(
      'startTimePrompt-default.png',
    );
  });

  it('should show a start time of an hour or more with the hours', async () => {
    const { line } = await renderStartTimePrompt({ startTime: 3725 });

    expect(line).toHaveTextContent('Start Listening at 1:02:05?');
    expect(screen.getByText('Play from 1:02:05')).toBeVisible();
  });

  it('should enable "Play from" when isPlayFromDisabled is not given', async () => {
    await renderStartTimePrompt();

    expect(screen.getByText('Play from 12:34')).toBeEnabled();
  });

  it('should disable "Play from", and keep "Not Now" enabled, when isPlayFromDisabled is true', async () => {
    const { onPlayFromClick } = await renderStartTimePrompt({
      isPlayFromDisabled: true,
    });

    fireEvent.click(screen.getByText('Play from 12:34'));

    expect(screen.getByText('Play from 12:34')).toBeDisabled();
    expect(screen.getByText('Not Now')).toBeEnabled();
    expect(onPlayFromClick).not.toHaveBeenCalled();
  });

  it('should apply a custom className to the root element', async () => {
    const { container } = await renderStartTimePrompt({ className: 'mt-4' });

    expect(container.firstElementChild).toHaveClass('mt-4');
  });

  it('should be a region with the line as its accessible name', async () => {
    await renderStartTimePrompt();

    expect(
      screen.getByRole('region', { name: 'Start Listening at 12:34?' }),
    ).toBeVisible();
  });

  it('should give the line its text in a polite live region after a client mount', async () => {
    const onNotNowClick = vi.fn();
    const onPlayFromClick = vi.fn();
    const { container } = render(
      <StartTimePrompt
        startTime={754}
        onNotNowClick={onNotNowClick}
        onPlayFromClick={onPlayFromClick}
      />,
    );
    const line = container.querySelector('[aria-live="polite"]');

    expect(line).toBeEmptyDOMElement();
    expect(
      await screen.findByText('Start Listening at 12:34?'),
    ).toHaveAttribute('aria-live', 'polite');
  });

  it('should put "Play from" first, and stack the buttons at phone width', async () => {
    await renderStartTimePrompt();

    const playFromButton = screen.getByRole('button', {
      name: 'Play from 12:34',
    });
    const notNowButton = screen.getByRole('button', { name: 'Not Now' });

    expect(
      playFromButton.compareDocumentPosition(notNowButton) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(playFromButton.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      notNowButton.getBoundingClientRect().top,
    );
  });

  it('should call the play function with the start time on a click of "Play from"', async () => {
    const { onNotNowClick, onPlayFromClick } = await renderStartTimePrompt();

    fireEvent.click(screen.getByText('Play from 12:34'));

    expect(onPlayFromClick).toHaveBeenCalledExactlyOnceWith(754);
    expect(onNotNowClick).not.toHaveBeenCalled();
  });

  it('should call only the "Not Now" function on a click of "Not Now"', async () => {
    const { onNotNowClick, onPlayFromClick } = await renderStartTimePrompt();

    fireEvent.click(screen.getByText('Not Now'));

    expect(onNotNowClick).toHaveBeenCalledOnce();
    expect(onPlayFromClick).not.toHaveBeenCalled();
  });

  describe('dark', () => {
    beforeAll(async () => {
      await commands.setColorScheme('dark');
    });

    afterAll(async () => {
      await commands.setColorScheme('light');
    });

    it('should render the line and the two buttons with the start time', async () => {
      const { container } = await renderStartTimePrompt();

      await expect(container.firstElementChild).toMatchScreenshot(
        'startTimePrompt-default-dark.png',
      );
    });
  });
});
