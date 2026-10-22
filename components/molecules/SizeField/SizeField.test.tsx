import { render } from '@testing-library/react';
import { LazyMotion, MotionGlobalConfig, domAnimation } from 'framer-motion';
import { commands } from 'vitest/browser';

import { SizeField } from './SizeField';

function renderSizeField(value: number, className?: string) {
  return render(
    <LazyMotion features={domAnimation}>
      <SizeField
        className={className}
        label="Player size"
        max={2}
        min={1}
        step={1}
        value={value}
      />
    </LazyMotion>,
  );
}

describe('SizeField', () => {
  // The meter animates its height. A screenshot taken before the end of the
  // animation can differ by one or two pixels from run to run.
  beforeAll(() => {
    MotionGlobalConfig.skipAnimations = true;
  });

  afterAll(() => {
    MotionGlobalConfig.skipAnimations = false;
  });

  describe('value', () => {
    it('should render size 1', async () => {
      const { container } = renderSizeField(1);
      const element = container.querySelector('button');
      await expect(element).toMatchScreenshot('sizeField-value-1.png');
    });

    it('should render size 2', async () => {
      const { container } = renderSizeField(2);
      const element = container.querySelector('button');
      await expect(element).toMatchScreenshot('sizeField-value-2.png');
    });
  });

  describe('className', () => {
    it('should apply a custom className to the root', () => {
      const { container } = renderSizeField(1, 'custom-class');

      expect(container.querySelector('button')).toHaveClass('custom-class');
    });
  });

  describe('dark', () => {
    beforeAll(async () => {
      await commands.setColorScheme('dark');
    });

    afterAll(async () => {
      await commands.setColorScheme('light');
    });

    it('should render size 1', async () => {
      const { container } = renderSizeField(1);
      const element = container.querySelector('button');
      await expect(element).toMatchScreenshot('sizeField-value-1-dark.png');
    });

    it('should render size 2', async () => {
      const { container } = renderSizeField(2);
      const element = container.querySelector('button');
      await expect(element).toMatchScreenshot('sizeField-value-2-dark.png');
    });
  });
});
