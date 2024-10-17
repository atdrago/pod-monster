import { useClassNames } from 'hooks/useClassNames';

import { range, rangeVariant } from './range.css';

type RangeProps = JSX.IntrinsicElements['input'] & {
  variant: 'volume' | 'audio';
};

export const Range = ({ className, variant, ...rangeProps }: RangeProps) => {
  const rootClassName = useClassNames(range, rangeVariant[variant], className);

  return <input type="range" className={rootClassName} {...rangeProps} />;
};
