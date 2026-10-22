import { render } from '@testing-library/react';
import { commands } from 'vitest/browser';

import { Badge } from './Badge';

describe('Badge', () => {
  it('should render default badge', async () => {
    const { container } = render(<Badge>Explicit</Badge>);
    const element = container.querySelector('span');
    await expect(element).toMatchScreenshot('badge-default.png');
  });

  describe('className', () => {
    it('should apply custom className', async () => {
      const { container } = render(
        <Badge className="custom-class">Explicit</Badge>,
      );
      const element = container.querySelector('span');
      await expect(element).toMatchScreenshot('badge-custom-className.png');
    });
  });

  describe('dark', () => {
    beforeAll(async () => {
      await commands.setColorScheme('dark');
    });

    afterAll(async () => {
      await commands.setColorScheme('light');
    });

    it('should render default badge', async () => {
      const { container } = render(<Badge>Explicit</Badge>);
      const element = container.querySelector('span');
      await expect(element).toMatchScreenshot('badge-default-dark.png');
    });

    it('should apply custom className', async () => {
      const { container } = render(
        <Badge className="custom-class">Explicit</Badge>,
      );
      const element = container.querySelector('span');
      await expect(element).toMatchScreenshot(
        'badge-custom-className-dark.png',
      );
    });
  });
});
