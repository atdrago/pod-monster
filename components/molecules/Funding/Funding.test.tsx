import { render, screen } from '@testing-library/react';
import { commands } from 'vitest/browser';

import { Funding } from './Funding';

const FUNDING = {
  message: 'Support the show',
  url: 'https://example.com/support',
};

describe('Funding', () => {
  describe('funding', () => {
    it('should render the message with the icons', async () => {
      const { container } = render(<Funding funding={FUNDING} />);
      const element = container.querySelector('a');
      await expect(element).toMatchScreenshot('funding-default.png');
    });

    it('should link to the funding URL in a new tab', () => {
      render(<Funding funding={FUNDING} />);

      const link = screen.getByRole('link', { name: 'Support the show' });

      expect(link).toHaveAttribute('href', 'https://example.com/support');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noreferrer noopener');
    });

    it('should render nothing when the show has no funding', () => {
      const { container } = render(<Funding funding={undefined} />);

      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('dark', () => {
    beforeAll(async () => {
      await commands.setColorScheme('dark');
    });

    afterAll(async () => {
      await commands.setColorScheme('light');
    });

    it('should render the message with the icons', async () => {
      const { container } = render(<Funding funding={FUNDING} />);
      const element = container.querySelector('a');
      await expect(element).toMatchScreenshot('funding-default-dark.png');
    });
  });
});
