import type { JSX } from 'react';

type BadgeProps = JSX.IntrinsicElements['span'] & {
  label?: string;
};

export const Badge = ({ className, label, ...spanProps }: BadgeProps) => (
  <span
    aria-label={label}
    className={`
        text-background bg-foreground
        font-bold leading-none align-middle text-lg whitespace-nowrap
        rounded-sm inline-block p-2 w-auto
        ${className ?? ''}
      `}
    style={{
      textBox: 'trim-both cap',
    }}
    {...spanProps}
  />
);
