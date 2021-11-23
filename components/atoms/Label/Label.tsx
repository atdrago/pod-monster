import type { FunctionComponent, PropsWithChildren } from 'react';

import { Typography } from 'components/atoms/Typography';

import { labelClassName } from './label.css';

interface ILabelProps extends PropsWithChildren<unknown> {}

export const Label: FunctionComponent<ILabelProps> = ({ children }) => {
  return (
    <Typography as="span" className={labelClassName} size="paragraph">
      {children}
    </Typography>
  );
};
