import type { ReactEventHandler } from 'react';

import { Button } from 'components/atoms/Button';
import { Stack } from 'components/layouts/Stack';
import SpinnerIcon from 'icons/spinner8.svg';
import UploadIcon8 from 'icons/upload2.svg';

import {
  buttonClassName,
  fileSpinnerClassName,
  iconClassName,
  inputClassName,
} from './fileField.css';

interface IFileFieldProps {
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
}: IFileFieldProps) => {
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
          <SpinnerIcon aria-hidden="true" className={fileSpinnerClassName} />
        ) : (
          <UploadIcon8 aria-hidden="true" className={iconClassName} />
        )}
        {isLoading ? loadingLabel : label}
      </Stack>
    </Button>
  );
};
