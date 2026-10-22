import { render, screen } from '@testing-library/react';
import { commands } from 'vitest/browser';

import { Label } from './Label';

describe('Label', () => {
  it('should render default content', async () => {
    // The padding of the wrapper puts the shadow inside the screenshot.
    const { container } = render(
      <div className="w-fit p-2">
        <Label>Technology</Label>
      </div>,
    );
    const element = container.firstElementChild;
    await expect(element).toMatchScreenshot('label-default.png');
  });

  describe('className', () => {
    it('should render without a className', () => {
      render(<Label>Technology</Label>);
      expect(screen.getByText('Technology')).toBeVisible();
    });

    it('should apply a custom className to the root', () => {
      render(<Label className="mt-4">Technology</Label>);
      const element = screen.getByText('Technology');
      expect(element).toBeVisible();
      expect(element).toHaveClass('mt-4');
      expect(element).toHaveStyle({ marginTop: '16px' });
    });
  });

  describe('color scheme', () => {
    afterEach(async () => {
      await commands.setColorScheme('light');
    });

    it('should change the shadow color in dark mode', async () => {
      render(<Label>Technology</Label>);
      const element = screen.getByText('Technology');
      const lightBoxShadow = getComputedStyle(element).boxShadow;

      await commands.setColorScheme('dark');

      expect(getComputedStyle(element).boxShadow).not.toBe(lightBoxShadow);
    });
  });

  describe('dark', () => {
    beforeAll(async () => {
      await commands.setColorScheme('dark');
    });

    afterAll(async () => {
      await commands.setColorScheme('light');
    });

    it('should render default content', async () => {
      const { container } = render(
        <div className="w-fit p-2">
          <Label>Technology</Label>
        </div>,
      );
      const element = container.firstElementChild;
      await expect(element).toMatchScreenshot('label-default-dark.png');
    });
  });
});
