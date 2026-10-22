import { render, screen } from '@testing-library/react';
import { commands } from 'vitest/browser';

import { Button } from './Button';

describe('Button', () => {
  describe('states', () => {
    it('should render enabled button', async () => {
      const { container } = render(<Button>Try again</Button>);
      const element = container.querySelector('button');
      expect(screen.getByText('Try again')).toBeEnabled();
      expect(screen.getByText('Try again')).toHaveAttribute('type', 'button');
      await expect(element).toMatchScreenshot('button-enabled.png');
    });

    it('should render disabled button', async () => {
      const { container } = render(<Button disabled>Try again</Button>);
      const element = container.querySelector('button');
      expect(screen.getByText('Try again')).toBeDisabled();
      await expect(element).toMatchScreenshot('button-disabled.png');
    });
  });

  describe('polymorphic', () => {
    it('should render as label element', async () => {
      const { container } = render(
        <Button as="label" role="button">
          Upload a file
        </Button>,
      );
      const element = container.querySelector('label');
      expect(screen.getByRole('button')).toHaveTextContent('Upload a file');
      await expect(element).toMatchScreenshot('button-as-label.png');
    });
  });

  describe('dark', () => {
    beforeAll(async () => {
      await commands.setColorScheme('dark');
    });

    afterAll(async () => {
      await commands.setColorScheme('light');
    });

    it('should render enabled button', async () => {
      const { container } = render(<Button>Try again</Button>);
      const element = container.querySelector('button');
      await expect(element).toMatchScreenshot('button-enabled-dark.png');
    });

    it('should render disabled button', async () => {
      const { container } = render(<Button disabled>Try again</Button>);
      const element = container.querySelector('button');
      await expect(element).toMatchScreenshot('button-disabled-dark.png');
    });

    it('should render as label element', async () => {
      const { container } = render(
        <Button as="label" role="button">
          Upload a file
        </Button>,
      );
      const element = container.querySelector('label');
      await expect(element).toMatchScreenshot('button-as-label-dark.png');
    });
  });
});
