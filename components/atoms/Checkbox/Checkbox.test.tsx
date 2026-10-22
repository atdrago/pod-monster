import { render } from '@testing-library/react';
import { commands } from 'vitest/browser';

import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
  it('should render unchecked checkbox', async () => {
    const { container } = render(<Checkbox>Unchecked option</Checkbox>);
    const element = container.querySelector('label');
    await expect(element).toMatchScreenshot('checkbox-unchecked.png');
  });

  it('should render checked checkbox', async () => {
    const { container } = render(
      <Checkbox checked={true} onChange={() => {}}>
        Checked option
      </Checkbox>,
    );
    const element = container.querySelector('label');
    await expect(element).toMatchScreenshot('checkbox-checked.png');
  });

  describe('legacy sizes', () => {
    it('should render a 12px box', () => {
      const { container } = render(<Checkbox>Unchecked option</Checkbox>);
      expect(container.querySelector('span')).toHaveStyle({
        height: '12px',
        width: '12px',
      });
    });

    it('should render a 12px box and a 12px check mark when checked', () => {
      const { container } = render(
        <Checkbox checked={true} onChange={() => {}}>
          Checked option
        </Checkbox>,
      );
      expect(container.querySelector('span')).toHaveStyle({
        height: '12px',
        width: '12px',
      });
      expect(container.querySelector('svg')).toHaveStyle({
        height: '12px',
        width: '12px',
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

    it('should render unchecked checkbox', async () => {
      const { container } = render(<Checkbox>Unchecked option</Checkbox>);
      const element = container.querySelector('label');
      await expect(element).toMatchScreenshot('checkbox-unchecked-dark.png');
    });

    it('should render checked checkbox', async () => {
      const { container } = render(
        <Checkbox checked={true} onChange={() => {}}>
          Checked option
        </Checkbox>,
      );
      const element = container.querySelector('label');
      await expect(element).toMatchScreenshot('checkbox-checked-dark.png');
    });
  });
});
