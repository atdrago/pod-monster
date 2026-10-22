import { render } from '@testing-library/react';
import { LazyMotion, domAnimation } from 'framer-motion';
import { commands } from 'vitest/browser';

import { SizeField } from './SizeField';

function renderSizeField(value: number) {
  return render(
    <LazyMotion features={domAnimation}>
      <SizeField label="Player size" max={2} min={1} step={1} value={value} />
    </LazyMotion>,
  );
}

describe('SizeField', () => {
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
