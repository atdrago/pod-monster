import type { JSX } from 'react';

type BadgeProps = JSX.IntrinsicElements['span'] & {
  label?: string;
};

export const Badge = ({ className, label, ...spanProps }: BadgeProps) => (
  <span
    aria-label={label}
    className={`
        text-background bg-foreground
        font-bold leading-none align-middle text-xs whitespace-nowrap
        rounded-sm inline-block pt-2 px-1 pb-[7px] w-auto
        text-box-trim-cap
        ${className ?? ''}
      `}
    {...spanProps}
  />
);
