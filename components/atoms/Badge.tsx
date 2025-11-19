import type { JSX } from 'react';

type BadgeProps = JSX.IntrinsicElements['span'] & {
  label?: string;
};

export const Badge = ({ label, ...spanProps }: BadgeProps) => (
  <span
    aria-label={label}
    className={`
        text-zinc-200 dark:text-zinc-900
        bg-zinc-800 dark:bg-zinc-200
        font-bold leading-none align-middle text-lg whitespace-nowrap
        rounded-sm inline-block p-2 w-auto
      `}
    style={{
      textBox: 'trim-both cap',
    }}
    {...spanProps}
  />
);
