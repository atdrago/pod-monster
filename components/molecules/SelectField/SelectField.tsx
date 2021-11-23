import type { FunctionComponent } from 'react';

import { Typography } from 'components/atoms/Typography';
import { Stack } from 'components/layouts/Stack';
import { inputField } from 'components/molecules/InputField/inputField.css';
import { useClassNames } from 'hooks/useClassNames';
import { useUniqueId } from 'hooks/useUniqueId';
import type { ISelectFieldProps } from 'types';

export const SelectField: FunctionComponent<ISelectFieldProps> = ({
  children,
  className,
  label,
  ...selectProps
}) => {
  const id = useUniqueId();
  const rootClassName = useClassNames(inputField, className);

  return (
    <Stack space="small" maxWidth="small">
      {label && (
        <Typography as="label" size="paragraph" htmlFor={id}>
          {label}
        </Typography>
      )}
      <select className={rootClassName} id={id} {...selectProps}>
        {children}
      </select>
    </Stack>
  );
};
