import { useClassNames } from 'hooks/useClassNames';

import { badgeClassName } from './badge.css';

type BadgeProps = JSX.IntrinsicElements['span'] & {
  label?: string;
};

export const Badge = ({ className, label, ...spanProps }: BadgeProps) => {
  return (
    <span
      aria-label={label}
      className={useClassNames(badgeClassName, className)}
      {...spanProps}
    />
  );
};
