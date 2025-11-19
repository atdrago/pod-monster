import { render } from '@testing-library/react';
import { vi } from 'vitest';

import { Checkbox } from './Checkbox';

vi.mock('icons/checkmark.svg', () => ({
  default: () => (
    <svg viewBox="0 0 32 32">
      <path d="M27 4l-15 15-7-7-5 5 12 12 20-20z" />
    </svg>
  ),
}));

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
});
