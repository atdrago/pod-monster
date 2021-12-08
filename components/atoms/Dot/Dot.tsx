import { useClassNames } from 'hooks/useClassNames';

import { backgroundVariants, dotClassName } from './dot.css';

interface IDotProps {
  color: keyof typeof backgroundVariants;
  label?: string;
}

export const Dot = ({ color, label }: IDotProps) => {
  const baseClassName = useClassNames(dotClassName, backgroundVariants[color]);

  return <span className={baseClassName} aria-label={label} />;
};
