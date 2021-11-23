import { ReactNode } from 'react';

export type DetailsProps = JSX.IntrinsicElements['details'] & {
  footer?: ReactNode;
  summary: ReactNode;
};
