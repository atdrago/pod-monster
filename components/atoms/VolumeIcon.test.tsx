import { render } from '@testing-library/react';
import { commands } from 'vitest/browser';

import { VolumeIcon } from './VolumeIcon';

describe('VolumeIcon', () => {
  describe('volume', () => {
    it('should render the high icon above 0.75', async () => {
      const { container } = render(<VolumeIcon isMuted={false} volume={1} />);
      const element = container.querySelector('span');
      await expect(element).toMatchScreenshot('volumeIcon-volume-high.png');
    });

    it('should render the medium icon above 0.25', async () => {
      const { container } = render(<VolumeIcon isMuted={false} volume={0.5} />);
      const element = container.querySelector('span');
      await expect(element).toMatchScreenshot('volumeIcon-volume-medium.png');
    });

    it('should render the low icon above 0', async () => {
      const { container } = render(<VolumeIcon isMuted={false} volume={0.1} />);
      const element = container.querySelector('span');
      await expect(element).toMatchScreenshot('volumeIcon-volume-low.png');
    });

    it('should render the zero icon at 0', async () => {
      const { container } = render(<VolumeIcon isMuted={false} volume={0} />);
      const element = container.querySelector('span');
      await expect(element).toMatchScreenshot('volumeIcon-volume-zero.png');
    });
  });

  describe('isMuted', () => {
    it('should render the mute icon at any volume', async () => {
      const { container } = render(<VolumeIcon isMuted={true} volume={1} />);
      const element = container.querySelector('span');
      await expect(element).toMatchScreenshot('volumeIcon-muted.png');
    });
  });

  describe('dark', () => {
    beforeAll(async () => {
      await commands.setColorScheme('dark');
    });

    afterAll(async () => {
      await commands.setColorScheme('light');
    });

    it('should render the high icon above 0.75', async () => {
      const { container } = render(<VolumeIcon isMuted={false} volume={1} />);
      const element = container.querySelector('span');
      await expect(element).toMatchScreenshot(
        'volumeIcon-volume-high-dark.png',
      );
    });
  });
});
