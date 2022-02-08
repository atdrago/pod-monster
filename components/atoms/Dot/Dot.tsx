import { useClassNames } from 'hooks/useClassNames';

import { backgroundVariants, dotClassName } from './dot.css';

type DotProps = JSX.IntrinsicElements['span'] & {
  color: keyof typeof backgroundVariants;
  label?: string;
};

export const Dot = ({ className, color, label, ...spanProps }: DotProps) => {
  const baseClassName = useClassNames(
    dotClassName,
    backgroundVariants[color],
    className
  );

  return (
    <span
      aria-label={label}
      className={baseClassName}
      role="status"
      {...spanProps}
    />
  );
};
