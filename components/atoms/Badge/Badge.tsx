import { Typography } from 'components/atoms/Typography';
import { useClassNames } from 'hooks/useClassNames';

import { badgeClassName } from './badge.css';

type BadgeProps = JSX.IntrinsicElements['span'] & {
  label?: string;
};

export const Badge = ({ className, label, ...spanProps }: BadgeProps) => {
  className = useClassNames(badgeClassName, className);

  return (
    <Typography
      as="span"
      aria-label={label}
      className={className}
      size="legal"
      {...spanProps}
    />
  );
};
