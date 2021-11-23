import { Icon } from 'components/atoms/Icon';
import { Typography } from 'components/atoms/Typography';
import { Stack } from 'components/layouts/Stack';
import { useClassNames } from 'hooks/useClassNames';
import CheckedIcon from 'icons/checkmark.svg';
import { CheckboxComponent } from 'types';

import { checkbox, checkboxChecked, input, label } from './checkbox.css';

export const Checkbox: CheckboxComponent = ({
  checked = false,
  children,
  className,
  onChange,
  ...labelProps
}) => {
  const baseClassName = useClassNames(label, className);

  return (
    <Typography
      as="label"
      size="paragraph"
      className={baseClassName}
      {...labelProps}
    >
      <input
        checked={checked}
        className={input}
        onChange={onChange}
        type="checkbox"
      />
      <Stack align="center" kind="flexRow" space="small">
        {checked ? (
          <span className={checkboxChecked}>
            <Icon color="background" size="xsmall">
              <CheckedIcon />
            </Icon>
          </span>
        ) : (
          <span className={checkbox}></span>
        )}
        {children}
      </Stack>
    </Typography>
  );
};
