import { render, screen } from '@testing-library/react';
import { commands } from 'vitest/browser';

import { Footer } from './Footer';

describe('Footer', () => {
  it('should render the footer', async () => {
    const { container } = render(<Footer />);
    const element = container.querySelector('footer');
    await expect(element).toMatchScreenshot('footer-default.png');
  });

  describe('links', () => {
    it('should show the four links', () => {
      render(<Footer />);

      expect(screen.getByText('Home')).toBeVisible();
      expect(screen.getByText('About')).toBeVisible();
      expect(screen.getByText('Settings')).toBeVisible();
      expect(screen.getByText('GitHub')).toBeVisible();
    });

    it('should not underline the internal links', () => {
      render(<Footer />);

      expect(screen.getByText('Home')).toHaveStyle({
        textDecorationLine: 'none',
      });
      expect(screen.getByText('About')).toHaveStyle({
        textDecorationLine: 'none',
      });
      expect(screen.getByText('Settings')).toHaveStyle({
        textDecorationLine: 'none',
      });
    });

    it('should underline the GitHub link', () => {
      render(<Footer />);

      expect(screen.getByText('GitHub')).toHaveStyle({
        textDecorationLine: 'underline',
      });
    });
  });

  describe('dark', () => {
    beforeAll(async () => {
      await commands.setColorScheme('dark');
    });

    afterAll(async () => {
      await commands.setColorScheme('light');
    });

    it('should render the footer', async () => {
      const { container } = render(<Footer />);
      const element = container.querySelector('footer');
      await expect(element).toMatchScreenshot('footer-default-dark.png');
    });
  });
});
