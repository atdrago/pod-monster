import { render, screen } from '@testing-library/react';
import { commands } from 'vitest/browser';

import { Progress } from './Progress';

describe('Progress', () => {
  describe('not highlighted', () => {
    it('should render 0 percent', async () => {
      const { container } = render(<Progress percent={0} />);
      const element = container.firstElementChild;
      await expect(element).toMatchScreenshot('progress-0.png');
    });

    it('should render 50 percent', async () => {
      const { container } = render(<Progress percent={0.5} />);
      const element = container.firstElementChild;
      await expect(element).toMatchScreenshot('progress-50.png');
    });

    it('should render 100 percent', async () => {
      const { container } = render(<Progress percent={1} />);
      const element = container.firstElementChild;
      await expect(element).toMatchScreenshot('progress-100.png');
    });
  });

  describe('highlighted', () => {
    it('should render 0 percent', async () => {
      const { container } = render(
        <Progress isHighlighted={true} percent={0} />,
      );
      const element = container.firstElementChild;
      await expect(element).toMatchScreenshot('progress-highlighted-0.png');
    });

    it('should render 50 percent', async () => {
      const { container } = render(
        <Progress isHighlighted={true} percent={0.5} />,
      );
      const element = container.firstElementChild;
      await expect(element).toMatchScreenshot('progress-highlighted-50.png');
    });

    it('should render 100 percent', async () => {
      const { container } = render(
        <Progress isHighlighted={true} percent={1} />,
      );
      const element = container.firstElementChild;
      await expect(element).toMatchScreenshot('progress-highlighted-100.png');
    });
  });

  describe('titles', () => {
    it('should render the four titles', async () => {
      const { container } = render(
        <Progress
          bottomLeftTitle="00:30:00"
          bottomRightTitle="00:30:00"
          percent={0.5}
          topLeftTitle="Top left"
          topRightTitle="Top right"
        />,
      );
      const element = container.firstElementChild;

      expect(screen.getByText('Top left')).toBeVisible();
      expect(screen.getByText('Top right')).toBeVisible();
      expect(screen.getAllByText('00:30:00')).toHaveLength(2);
      await expect(element).toMatchScreenshot('progress-titles.png');
    });

    it('should render no bar when no percent is given', () => {
      const { container } = render(<Progress topLeftTitle="Top left" />);

      expect(screen.getByText('Top left')).toBeVisible();
      expect(container.firstElementChild?.children).toHaveLength(1);
    });
  });

  describe('bar color', () => {
    it('should apply the foreground color to a highlighted bar', () => {
      const { container } = render(
        <Progress isHighlighted={true} percent={0.5} />,
      );
      const bar =
        container.firstElementChild?.firstElementChild?.firstElementChild;

      expect(bar).toHaveClass('bg-foreground');
      expect(bar).not.toHaveClass('bg-note-border');
    });

    it('should apply the note border color to a bar that is not highlighted', () => {
      const { container } = render(<Progress percent={0.5} />);
      const bar =
        container.firstElementChild?.firstElementChild?.firstElementChild;

      expect(bar).toHaveClass('bg-note-border');
      expect(bar).not.toHaveClass('bg-foreground');
    });
  });

  describe('className', () => {
    it('should apply a custom className to the root', () => {
      const { container } = render(
        <Progress className="custom-class" percent={0.5} />,
      );

      expect(container.firstElementChild).toHaveClass('custom-class');
    });
  });

  describe('dark', () => {
    beforeAll(async () => {
      await commands.setColorScheme('dark');
    });

    afterAll(async () => {
      await commands.setColorScheme('light');
    });

    it('should render 0 percent', async () => {
      const { container } = render(<Progress percent={0} />);
      const element = container.firstElementChild;
      await expect(element).toMatchScreenshot('progress-0-dark.png');
    });

    it('should render 50 percent', async () => {
      const { container } = render(<Progress percent={0.5} />);
      const element = container.firstElementChild;
      await expect(element).toMatchScreenshot('progress-50-dark.png');
    });

    it('should render 100 percent', async () => {
      const { container } = render(<Progress percent={1} />);
      const element = container.firstElementChild;
      await expect(element).toMatchScreenshot('progress-100-dark.png');
    });

    it('should render highlighted 0 percent', async () => {
      const { container } = render(
        <Progress isHighlighted={true} percent={0} />,
      );
      const element = container.firstElementChild;
      await expect(element).toMatchScreenshot(
        'progress-highlighted-0-dark.png',
      );
    });

    it('should render highlighted 50 percent', async () => {
      const { container } = render(
        <Progress isHighlighted={true} percent={0.5} />,
      );
      const element = container.firstElementChild;
      await expect(element).toMatchScreenshot(
        'progress-highlighted-50-dark.png',
      );
    });

    it('should render highlighted 100 percent', async () => {
      const { container } = render(
        <Progress isHighlighted={true} percent={1} />,
      );
      const element = container.firstElementChild;
      await expect(element).toMatchScreenshot(
        'progress-highlighted-100-dark.png',
      );
    });

    it('should render the four titles', async () => {
      const { container } = render(
        <Progress
          bottomLeftTitle="00:30:00"
          bottomRightTitle="00:30:00"
          percent={0.5}
          topLeftTitle="Top left"
          topRightTitle="Top right"
        />,
      );
      const element = container.firstElementChild;
      await expect(element).toMatchScreenshot('progress-titles-dark.png');
    });
  });
});
