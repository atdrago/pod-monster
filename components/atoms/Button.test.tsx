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

  describe('legacy sizes', () => {
    it('should render 16px text', () => {
      render(<Button>Try again</Button>);
      expect(screen.getByText('Try again')).toHaveStyle({ fontSize: '16px' });
    });

    it('should pad the button by 12px', () => {
      render(<Button>Try again</Button>);
      expect(screen.getByText('Try again')).toHaveStyle({ padding: '12px' });
    });

    it('should trim the text to the cap height', () => {
      render(<Button>Try again</Button>);
      const element = screen.getByText('Try again');
      const context = document.createElement('canvas').getContext('2d');

      if (context === null) {
        throw new Error('The canvas has no 2D context.');
      }

      context.font = getComputedStyle(element).font;
      const capHeight = context.measureText('H').actualBoundingBoxAscent;

      expect(element).toHaveStyle({ textBoxTrim: 'trim-both' });
      // The padding is 12px on each side, and the border is 1px.
      expect(element.getBoundingClientRect().height).toBeCloseTo(
        capHeight + 2 * 12 + 2 * 1,
        0,
      );
    });

    it('should round the corners by 4px', () => {
      render(<Button>Try again</Button>);
      expect(screen.getByText('Try again')).toHaveStyle({
        borderRadius: '4px',
      });
    });
  });

  describe('className', () => {
    it('should write no undefined class when no className is given', () => {
      render(<Button>Try again</Button>);
      expect(screen.getByText('Try again')).not.toHaveClass('undefined');
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
