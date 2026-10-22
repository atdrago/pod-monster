import { render } from '@testing-library/react';
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
