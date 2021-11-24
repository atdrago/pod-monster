import type { ReactNode } from 'react';

export type InputFieldProps = JSX.IntrinsicElements['input'] & {
  feedback?: string | null;
  label: ReactNode;
  type?: 'date' | 'search' | 'text' | 'time';
};
