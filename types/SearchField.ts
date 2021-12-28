import type { ReactNode } from 'react';

export type SearchFieldProps = JSX.IntrinsicElements['input'] & {
  feedback?: string | null;
  label: ReactNode;
  type?: 'search';
};
