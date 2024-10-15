import type { FunctionComponent, ReactEventHandler } from 'react';

interface CheckboxComponentProps
  extends Omit<JSX.IntrinsicElements['label'], 'checked' | 'onChange'> {
  checked?: boolean;
  onChange?: ReactEventHandler<HTMLInputElement>;
}

export type CheckboxComponent = FunctionComponent<CheckboxComponentProps>;
