import { PropsWithChildren } from 'react';

export interface ISelectFieldProps
  extends PropsWithChildren<JSX.IntrinsicElements['select']> {
  label: string;
}
