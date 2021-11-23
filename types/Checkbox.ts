import type { FunctionComponent, ReactEventHandler } from 'react';

interface ICheckboxComponentProps
  extends Omit<JSX.IntrinsicElements['label'], 'checked' | 'onChange'> {
  checked?: boolean;
  onChange?: ReactEventHandler<HTMLInputElement>;
}

export type CheckboxComponent = FunctionComponent<ICheckboxComponentProps>;
