import { useClassNames } from 'hooks/useClassNames';

import { range, rangeVariant } from './range.css';

import type { JSX } from 'react';

type RangeProps = JSX.IntrinsicElements['input'] & {
  variant: 'volume' | 'audio';
};

export const Range = ({ className, variant, ...rangeProps }: RangeProps) => {
  const rootClassName = useClassNames(range, rangeVariant[variant], className);

  return <input type="range" className={rootClassName} {...rangeProps} />;
};
