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
