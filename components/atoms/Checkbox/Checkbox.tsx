import type { ReactEventHandler, JSX } from 'react';

import { Typography } from 'components/atoms/Typography';
import { Stack } from 'components/layouts/Stack';
import CheckedIcon from 'icons/checkmark.svg';

interface CheckboxProps extends Omit<
  JSX.IntrinsicElements['label'],
  'checked' | 'onChange'
> {
  checked?: boolean;
  onChange?: ReactEventHandler<HTMLInputElement>;
}

export const Checkbox = ({
  checked = false,
  children,
  className,
  onChange = () => {},
  ...labelProps
}: CheckboxProps) => {
  return (
    <label
      className={`cursor-pointer flex-auto shrink-0 ${className ?? ''}`}
      {...labelProps}
    >
      <input
        checked={checked}
        className="hidden"
        onChange={onChange}
        type="checkbox"
      />
      <Stack kind="flexRow" space="xsmall">
        <span
          // should be "h-3 w-3" after removing global font size adjustment
          className={`
            inline-block flex-auto shrink-0 h-5 w-5 leading-0
            border-foreground-light dark:border-foreground-dark
            ${
              checked
                ? 'bg-foreground-light dark:bg-foreground-dark border-0'
                : 'bg-background-light dark:bg-background-dark border-2'
            }
          `}
        >
          {checked ? (
            <CheckedIcon
              // should be "h-3 w-3" after removing global font size adjustment
              className="text-background-light dark:text-background-dark h-5 w-5 leading-0"
            />
          ) : null}
        </span>
        <Typography as="span" size="paragraph">
          {children}
        </Typography>
      </Stack>
    </label>
  );
};
