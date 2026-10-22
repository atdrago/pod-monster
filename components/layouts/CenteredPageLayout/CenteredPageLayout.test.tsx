import { render } from '@testing-library/react';
import { commands, page } from 'vitest/browser';

import { Typography } from 'components/atoms/Typography';

import { CenteredPageLayout } from './CenteredPageLayout';

function ChildBlock() {
  return (
    <Typography as="p" size="paragraph">
      Centered content
    </Typography>
  );
}

describe('CenteredPageLayout', () => {
  it('should render a child block', async () => {
    const { container } = render(
      <CenteredPageLayout>
        <ChildBlock />
      </CenteredPageLayout>,
    );
    const element = container.firstElementChild;
    await expect(element).toMatchScreenshot('centeredPageLayout-default.png');
  });

  describe('className', () => {
    it('should apply a custom className', () => {
      const { container } = render(
        <CenteredPageLayout className="custom-class" />,
      );

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

    it('should render a child block', async () => {
      const { container } = render(
        <CenteredPageLayout>
          <ChildBlock />
        </CenteredPageLayout>,
      );
      const element = container.firstElementChild;
      expect(element?.getBoundingClientRect().width).toBe(1024);
      await expect(element).toMatchScreenshot(
        'centeredPageLayout-default-wide.png',
      );
    });
  });

  describe('dark', () => {
    beforeAll(async () => {
      await commands.setColorScheme('dark');
    });

    afterAll(async () => {
      await commands.setColorScheme('light');
    });

    it('should render a child block', async () => {
      const { container } = render(
        <CenteredPageLayout>
          <ChildBlock />
        </CenteredPageLayout>,
      );
      const element = container.firstElementChild;
      await expect(element).toMatchScreenshot(
        'centeredPageLayout-default-dark.png',
      );
    });
  });
});
