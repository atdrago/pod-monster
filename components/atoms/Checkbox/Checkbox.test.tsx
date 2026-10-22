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
