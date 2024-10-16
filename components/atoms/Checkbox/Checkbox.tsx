import type { ReactEventHandler } from 'react';
import { Icon } from 'components/atoms/Icon';
import { Typography } from 'components/atoms/Typography';
import { Stack } from 'components/layouts/Stack';
import { useClassNames } from 'hooks/useClassNames';
import CheckedIcon from 'icons/checkmark.svg';

import { checkbox, checkboxChecked, input, label } from './checkbox.css';

interface CheckboxProps
  extends Omit<JSX.IntrinsicElements['label'], 'checked' | 'onChange'> {
  checked?: boolean;
  onChange?: ReactEventHandler<HTMLInputElement>;
}

export const Checkbox = ({
  checked = false,
  children,
  className,
  onChange,
  ...labelProps
}: CheckboxProps) => {
  const baseClassName = useClassNames(label, className);

  return (
    <label className={baseClassName} {...labelProps}>
      <input
        checked={checked}
        className={input}
        onChange={onChange}
        type="checkbox"
      />
      <Stack kind="flexRow" space="xsmall">
        {checked ? (
          <span className={checkboxChecked}>
            <Icon color="background" size="xsmall">
              <CheckedIcon />
            </Icon>
          </span>
        ) : (
          <span className={checkbox}></span>
        )}
        <Typography as="span" size="paragraph">
          {children}
        </Typography>
      </Stack>
    </label>
  );
};
