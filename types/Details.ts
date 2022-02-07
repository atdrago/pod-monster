import { ReactNode } from 'react';

export type DetailsProps = JSX.IntrinsicElements['details'] & {
  footer?: ReactNode;
  hasError?: boolean;
  isLoading?: boolean;
  summary: ReactNode;
};
