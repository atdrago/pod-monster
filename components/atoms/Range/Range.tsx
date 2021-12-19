import type { FunctionComponent } from 'react';

import { useClassNames } from 'hooks/useClassNames';
import type { RangeProps } from 'types';

import { range, rangeVariant } from './range.css';

export const Range: FunctionComponent<RangeProps> = ({
  className,
  variant,
  ...rangeProps
}: RangeProps) => {
  const rootClassName = useClassNames(range, rangeVariant[variant], className);

  return <input type="range" className={rootClassName} {...rangeProps} />;
};
