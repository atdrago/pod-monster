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
    it('should show the three links', () => {
      render(<Footer />);

      expect(screen.getByText('Home')).toBeVisible();
      expect(screen.getByText('About')).toBeVisible();
      expect(screen.getByText('GitHub')).toBeVisible();
      expect(screen.queryByText('Settings')).toBeNull();
    });

    it('should not underline the internal links', () => {
      render(<Footer />);

      expect(screen.getByText('Home')).toHaveStyle({
        textDecorationLine: 'none',
      });
      expect(screen.getByText('About')).toHaveStyle({
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

  describe('list', () => {
    it('should show no list markers', () => {
      const { container } = render(<Footer />);

      expect(container.querySelector('ul')).toHaveStyle({
        listStyleType: 'none',
      });
    });
  });

  describe('className', () => {
    it('should apply a custom className to the root', () => {
      const { container } = render(<Footer className="custom-class" />);

      expect(container.querySelector('footer')).toHaveClass('custom-class');
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
