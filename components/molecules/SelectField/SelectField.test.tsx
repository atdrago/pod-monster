import { render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { commands } from 'vitest/browser';

import { SelectField } from './SelectField';

function noop() {}

function PlaybackRateField(
  props: Pick<ComponentProps<typeof SelectField>, 'label'>,
) {
  return (
    <SelectField onChange={noop} value="1" {...props}>
      <option value="0.5">0.5</option>
      <option value="1">1</option>
      <option value="1.5">1.5</option>
    </SelectField>
  );
}

describe('SelectField', () => {
  it('should render the label of the selected option', async () => {
    const { container } = render(<PlaybackRateField label="1x" />);
    const element = container.querySelector('label');

    expect(screen.getByRole('combobox')).toHaveValue('1');
    expect(screen.getByText('1x')).toBeVisible();
    await expect(element).toMatchScreenshot('selectField-default.png');
  });

  describe('label', () => {
    it('should render the value when no label is given', async () => {
      const { container } = render(<PlaybackRateField />);
      const element = container.querySelector('label');
      await expect(element).toMatchScreenshot('selectField-no-label.png');
    });
  });

  describe('dark', () => {
    beforeAll(async () => {
      await commands.setColorScheme('dark');
    });

    afterAll(async () => {
      await commands.setColorScheme('light');
    });

    it('should render the label of the selected option', async () => {
      const { container } = render(<PlaybackRateField label="1x" />);
      const element = container.querySelector('label');
      await expect(element).toMatchScreenshot('selectField-default-dark.png');
    });
  });
});
