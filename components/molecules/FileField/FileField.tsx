import type { ReactEventHandler } from 'react';

import { Button } from 'components/atoms/Button';
import { Icon } from 'components/atoms/Icon';
import { Stack } from 'components/layouts/Stack';
import SpinnerIcon from 'icons/spinner8.svg';
import UploadIcon8 from 'icons/upload2.svg';

import { buttonClassName, inputClassName } from './fileField.css';

interface FileFieldProps {
  accept?: string;
  isLoading?: boolean;
  label: string;
  loadingLabel?: string;
  onChange?: ReactEventHandler<HTMLInputElement>;
}

export const FileField = ({
  accept,
  isLoading = false,
  label,
  loadingLabel = 'Loading...',
  onChange,
}: FileFieldProps) => {
  return (
    <Button as="label" className={buttonClassName} role="button">
      <input
        accept={accept}
        className={inputClassName}
        type="file"
        onChange={onChange}
      />
      <Stack kind="flexRow" space="xsmall" align="center">
        {isLoading ? (
          <Icon
            as={SpinnerIcon}
            size="small"
            aria-hidden="true"
            orientation="spinning"
          />
        ) : (
          <Icon as={UploadIcon8} size="small" aria-hidden="true" />
        )}
        {isLoading ? loadingLabel : label}
      </Stack>
    </Button>
  );
};
