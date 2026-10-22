import type { PropsWithChildren } from 'react';

type LabelProps = PropsWithChildren<{
  className?: string;
}>;

export const Label = ({ children, className }: LabelProps) => {
  return (
    <span
      className={`
        inline-block w-auto p-2
        bg-background-highlight shadow-elevation-low
        text-paragraph text-box-trim-cap
        ${className ?? ''}
      `}
    >
      {children}
    </span>
  );
};
