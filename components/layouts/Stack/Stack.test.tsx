import { render } from '@testing-library/react';
import { commands, page } from 'vitest/browser';

import { Stack } from './Stack';

const BOX_WIDTHS = [48, 96, 72];

function Boxes() {
  return BOX_WIDTHS.map((width) => (
    <div
      key={width}
      style={{ background: 'rgb(113 113 122)', height: 24, width }}
    />
  ));
}

describe('Stack', () => {
  it('should render the default stack', async () => {
    const { container } = render(
      <Stack>
        <Boxes />
      </Stack>,
    );
    const element = container.firstElementChild;
    await expect(element).toMatchScreenshot('stack-default.png');
  });

  describe('space', () => {
    it('should render none space', async () => {
      const { container } = render(
        <Stack space="none">
          <Boxes />
        </Stack>,
      );
      const element = container.firstElementChild;
      await expect(element).toMatchScreenshot('stack-space-none.png');
    });

    it('should render xxsmall space', async () => {
      const { container } = render(
        <Stack space="xxsmall">
          <Boxes />
        </Stack>,
      );
      const element = container.firstElementChild;
      await expect(element).toMatchScreenshot('stack-space-xxsmall.png');
    });

    it('should render xsmall space', async () => {
      const { container } = render(
        <Stack space="xsmall">
          <Boxes />
        </Stack>,
      );
      const element = container.firstElementChild;
      await expect(element).toMatchScreenshot('stack-space-xsmall.png');
    });

    it('should render small space', async () => {
      const { container } = render(
        <Stack space="small">
          <Boxes />
        </Stack>,
      );
      const element = container.firstElementChild;
      await expect(element).toMatchScreenshot('stack-space-small.png');
    });

    it('should render medium space', async () => {
      const { container } = render(
        <Stack space="medium">
          <Boxes />
        </Stack>,
      );
      const element = container.firstElementChild;
      await expect(element).toMatchScreenshot('stack-space-medium.png');
    });

    it('should render large space', async () => {
      const { container } = render(
        <Stack space="large">
          <Boxes />
        </Stack>,
      );
      const element = container.firstElementChild;
      await expect(element).toMatchScreenshot('stack-space-large.png');
    });

    it('should render xlarge space', async () => {
      const { container } = render(
        <Stack space="xlarge">
          <Boxes />
        </Stack>,
      );
      const element = container.firstElementChild;
      await expect(element).toMatchScreenshot('stack-space-xlarge.png');
    });
  });

  describe('kind', () => {
    it('should render flex kind', async () => {
      const { container } = render(
        <Stack kind="flex" space="small">
          <Boxes />
        </Stack>,
      );
      const element = container.firstElementChild;
      await expect(element).toMatchScreenshot('stack-kind-flex.png');
    });

    it('should render flexRow kind', async () => {
      const { container } = render(
        <Stack kind="flexRow" space="small">
          <Boxes />
        </Stack>,
      );
      const element = container.firstElementChild;
      await expect(element).toMatchScreenshot('stack-kind-flexRow.png');
    });

    it('should render flexRowReverse kind', async () => {
      const { container } = render(
        <Stack kind="flexRowReverse" space="small">
          <Boxes />
        </Stack>,
      );
      const element = container.firstElementChild;
      await expect(element).toMatchScreenshot('stack-kind-flexRowReverse.png');
    });

    it('should render grid kind', async () => {
      const { container } = render(
        <Stack kind="grid" space="small">
          <Boxes />
        </Stack>,
      );
      const element = container.firstElementChild;
      await expect(element).toMatchScreenshot('stack-kind-grid.png');
    });
  });

  describe('align', () => {
    it('should render start align', async () => {
      const { container } = render(
        <Stack align="start" space="small">
          <Boxes />
        </Stack>,
      );
      const element = container.firstElementChild;
      await expect(element).toMatchScreenshot('stack-align-start.png');
    });

    it('should render center align', async () => {
      const { container } = render(
        <Stack align="center" space="small">
          <Boxes />
        </Stack>,
      );
      const element = container.firstElementChild;
      await expect(element).toMatchScreenshot('stack-align-center.png');
    });

    it('should render end align', async () => {
      const { container } = render(
        <Stack align="end" space="small">
          <Boxes />
        </Stack>,
      );
      const element = container.firstElementChild;
      await expect(element).toMatchScreenshot('stack-align-end.png');
    });
  });

  describe('justify', () => {
    it('should render center justify', async () => {
      const { container } = render(
        <Stack justify="center" kind="flexRow" space="small">
          <Boxes />
        </Stack>,
      );
      const element = container.firstElementChild;
      await expect(element).toMatchScreenshot('stack-justify-center.png');
    });

    it('should render spaceBetween justify', async () => {
      const { container } = render(
        <Stack justify="spaceBetween" kind="flexRow" space="small">
          <Boxes />
        </Stack>,
      );
      const element = container.firstElementChild;
      await expect(element).toMatchScreenshot('stack-justify-spaceBetween.png');
    });
  });

  describe('maxWidth', () => {
    it('should render small maxWidth', async () => {
      const { container } = render(
        <Stack maxWidth="small" space="small">
          <Boxes />
        </Stack>,
      );
      const element = container.firstElementChild;
      await expect(element).toMatchScreenshot('stack-maxWidth-small.png');
    });

    it('should limit the width to 1024px for the page maxWidth', () => {
      const { container } = render(
        <Stack maxWidth="page">
          <Boxes />
        </Stack>,
      );

      expect(container.firstElementChild).toHaveStyle({ maxWidth: '1024px' });
    });
  });

  describe('polymorphic', () => {
    it('should render as a list element', async () => {
      const { container } = render(
        <Stack as="ul" space="small">
          {BOX_WIDTHS.map((width) => (
            <li
              key={width}
              style={{ background: 'rgb(113 113 122)', height: 24, width }}
            />
          ))}
        </Stack>,
      );
      const element = container.querySelector('ul');
      await expect(element).toMatchScreenshot('stack-as-ul.png');
    });
  });

  describe('className', () => {
    it('should apply a custom className', () => {
      const { container } = render(<Stack className="custom-class" />);

      expect(container.firstElementChild).toHaveClass('custom-class');
    });
  });

  describe('wide', () => {
    beforeAll(async () => {
      await page.viewport(1024, 768);
    });

    afterAll(async () => {
      await page.viewport(414, 896);
    });

    it('should cap the width of a small maxWidth', async () => {
      const { container } = render(
        <Stack maxWidth="small" space="small">
          <Boxes />
        </Stack>,
      );
      const element = container.firstElementChild;
      expect(element?.getBoundingClientRect().width).toBe(480);
      await expect(element).toMatchScreenshot('stack-maxWidth-small-wide.png');
    });
  });

  describe('dark', () => {
    beforeAll(async () => {
      await commands.setColorScheme('dark');
    });

    afterAll(async () => {
      await commands.setColorScheme('light');
    });

    it('should render the default stack', async () => {
      const { container } = render(
        <Stack>
          <Boxes />
        </Stack>,
      );
      const element = container.firstElementChild;
      await expect(element).toMatchScreenshot('stack-default-dark.png');
    });
  });
});
