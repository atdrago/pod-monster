import type { PropsWithChildren } from 'react';

import { Typography } from 'components/atoms/Typography';

import { labelClassName } from './label.css';

export const Label = ({ children }: PropsWithChildren) => {
  return (
    <Typography as="span" className={labelClassName} size="paragraph">
      {children}
    </Typography>
  );
};
