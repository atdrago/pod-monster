import type { FunctionComponent } from 'react';

import { Typography } from 'components/atoms/Typography';
import { Stack } from 'components/layouts/Stack';
import { useUniqueId } from 'hooks/useUniqueId';
import type { InputFieldProps } from 'types';

import { inputFeedback, inputField, inputLabel } from './inputField.css';

export const InputField: FunctionComponent<InputFieldProps> = ({
  className,
  feedback,
  label,
  onChange,
  type = 'text',
  value,
  ...inputProps
}) => {
  const id = useUniqueId();

  return (
    <Stack className={className} maxWidth="small" space="small">
      <Typography
        as="label"
        className={inputLabel}
        htmlFor={id}
        size="paragraph"
      >
        {label}
        <span className={inputFeedback}>{feedback}</span>
      </Typography>
      <input
        className={inputField}
        id={id}
        onChange={onChange}
        type={type}
        value={value}
        {...inputProps}
      />
    </Stack>
  );
};
