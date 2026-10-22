import { render, screen } from '@testing-library/react';
import { commands } from 'vitest/browser';

import { Badge } from './Badge';

describe('Badge', () => {
  it('should render default badge', async () => {
    const { container } = render(<Badge>Explicit</Badge>);
    const element = container.querySelector('span');
    await expect(element).toMatchScreenshot('badge-default.png');
  });

  describe('legacy sizes', () => {
    it('should render 12px text', () => {
      render(<Badge>Explicit</Badge>);
      expect(screen.getByText('Explicit')).toHaveStyle({ fontSize: '12px' });
    });

    it('should pad the badge by 8px 4px 7px', () => {
      render(<Badge>Explicit</Badge>);
      expect(screen.getByText('Explicit')).toHaveStyle({
        padding: '8px 4px 7px',
      });
    });

    it('should round the corners by 4px', () => {
      render(<Badge>Explicit</Badge>);
      expect(screen.getByText('Explicit')).toHaveStyle({
        borderRadius: '4px',
      });
    });
  });

  describe('className', () => {
    it('should apply custom className', async () => {
      const { container } = render(
        <Badge className="custom-class">Explicit</Badge>,
      );
      const element = container.querySelector('span');
      await expect(element).toMatchScreenshot('badge-custom-className.png');
    });

    it('should keep the badge style when a custom className is given', () => {
      render(<Badge className="custom-class">Explicit</Badge>);
      const element = screen.getByText('Explicit');
      expect(element).toHaveClass('custom-class');
      expect(element).toHaveStyle({ fontWeight: '700' });
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
