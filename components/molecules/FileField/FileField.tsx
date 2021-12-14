import { ReactEventHandler } from 'react';

import { Button } from 'components/atoms/Button';
import { Stack } from 'components/layouts/Stack';
import SpinnerIcon from 'icons/spinner8.svg';
import UploadIcon8 from 'icons/upload2.svg';

import {
  buttonClassName,
  iconClassName,
  inputClassName,
  spinnerClassName,
} from './fileField.css';

interface IFileFieldProps {
  isLoading?: boolean;
  label: string;
  loadingLabel?: string;
  onChange?: ReactEventHandler<HTMLInputElement>;
}

export const FileField = ({
  isLoading = false,
  label,
  loadingLabel = 'Loading...',
  onChange,
}: IFileFieldProps) => {
  return (
    <Button as="label" className={buttonClassName} role="button">
      <input className={inputClassName} type="file" onChange={onChange} />
      <Stack kind="flexRow" space="xsmall" align="center">
        {isLoading ? (
          <SpinnerIcon aria-hidden="true" className={spinnerClassName} />
        ) : (
          <UploadIcon8 aria-hidden="true" className={iconClassName} />
        )}
        {isLoading ? loadingLabel : label}
      </Stack>
    </Button>
  );
};
