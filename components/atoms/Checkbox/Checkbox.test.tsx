import { render } from '@testing-library/react';

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
});
