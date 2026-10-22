import { render, screen } from '@testing-library/react';
import { commands } from 'vitest/browser';

import { Range } from './Range';

describe('Range', () => {
  describe('variants', () => {
    it('should render the audio variant at value 50', async () => {
      const { container } = render(
        <Range aria-label="Seek" defaultValue={50} variant="audio" />,
      );
      const element = container.querySelector('input');
      await expect(element).toMatchScreenshot('range-variant-audio.png');
    });

    it('should render the volume variant at value 50', async () => {
      const { container } = render(
        <Range aria-label="Volume" defaultValue={50} variant="volume" />,
      );
      const element = container.querySelector('input');
      await expect(element).toMatchScreenshot('range-variant-volume.png');
    });
  });

  describe('className', () => {
    it('should apply a custom className to the input', () => {
      render(
        <Range
          aria-label="Volume"
          className="custom-class"
          defaultValue={50}
          variant="volume"
        />,
      );

      expect(screen.getByRole('slider', { name: 'Volume' })).toHaveClass(
        'custom-class',
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

    it('should render the audio variant at value 50', async () => {
      const { container } = render(
        <Range aria-label="Seek" defaultValue={50} variant="audio" />,
      );
      const element = container.querySelector('input');
      await expect(element).toMatchScreenshot('range-variant-audio-dark.png');
    });

    it('should render the volume variant at value 50', async () => {
      const { container } = render(
        <Range aria-label="Volume" defaultValue={50} variant="volume" />,
      );
      const element = container.querySelector('input');
      await expect(element).toMatchScreenshot('range-variant-volume-dark.png');
    });
  });
});
