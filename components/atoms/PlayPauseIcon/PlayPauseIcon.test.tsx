import { render } from '@testing-library/react';
import { commands } from 'vitest/browser';

import { PlayPauseIcon } from './PlayPauseIcon';

describe('PlayPauseIcon', () => {
  describe('states', () => {
    it('should render the play icon when paused', async () => {
      const { container } = render(<PlayPauseIcon isPaused={true} />);
      const element = container.querySelector('span');
      await expect(element).toMatchScreenshot('playPauseIcon-paused.png');
    });

    it('should render the pause icon when playing', async () => {
      const { container } = render(<PlayPauseIcon isPaused={false} />);
      const element = container.querySelector('span');
      await expect(element).toMatchScreenshot('playPauseIcon-playing.png');
    });

    it('should render the spinner when loading', async () => {
      const { container } = render(
        <PlayPauseIcon isLoading={true} isPaused={false} />,
      );
      const element = container.querySelector('span');
      await expect(element).toMatchScreenshot('playPauseIcon-loading.png');
    });
  });

  describe('sizes', () => {
    it('should render the medium size', async () => {
      const { container } = render(
        <PlayPauseIcon isPaused={true} size="medium" />,
      );
      const element = container.querySelector('span');
      await expect(element).toMatchScreenshot('playPauseIcon-size-medium.png');
    });
  });

  describe('dark', () => {
    beforeAll(async () => {
      await commands.setColorScheme('dark');
    });

    afterAll(async () => {
      await commands.setColorScheme('light');
    });

    it('should render the play icon when paused', async () => {
      const { container } = render(<PlayPauseIcon isPaused={true} />);
      const element = container.querySelector('span');
      await expect(element).toMatchScreenshot('playPauseIcon-paused-dark.png');
    });

    it('should render the pause icon when playing', async () => {
      const { container } = render(<PlayPauseIcon isPaused={false} />);
      const element = container.querySelector('span');
      await expect(element).toMatchScreenshot('playPauseIcon-playing-dark.png');
    });
  });
});
