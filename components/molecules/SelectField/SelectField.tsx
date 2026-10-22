import type { JSX } from 'react';

import { Typography } from 'components/atoms/Typography';

type SelectFieldProps = JSX.IntrinsicElements['select'] & {
  label?: string;
};

export const SelectField = ({
  children,
  className,
  label,
  value,
  ...props
}: SelectFieldProps) => {
  return (
    <Typography
      as="label"
      className={`block relative font-bold ${className ?? ''}`}
      shouldTrimTextBox={false}
      size="paragraph"
      textAlign="center"
    >
      <select
        className="
          appearance-none absolute inset-0 m-auto w-full
          border-0 bg-transparent text-center text-transparent
        "
        value={value}
        {...props}
      >
        {children}
      </select>
      {label ?? value}
    </Typography>
  );
};
