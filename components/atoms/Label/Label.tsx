import type { PropsWithChildren } from 'react';

import { labelClassName } from './label.css';

export const Label = ({ children }: PropsWithChildren) => {
  return <span className={labelClassName}>{children}</span>;
};
