import type { JSX } from 'react';

type DotColor = 'blue' | 'green' | 'pink' | 'red' | 'transparent' | 'yellow';

type DotProps = JSX.IntrinsicElements['span'] & {
  color: DotColor;
  label?: string;
};

const colorClasses: Record<DotColor, string> = {
  blue: 'bg-[#56B6C2]',
  green: 'bg-[#98C379]',
  pink: 'bg-[#C678DD]',
  red: 'bg-[#E06C75]',
  transparent: 'bg-transparent',
  yellow: 'bg-[#D19A66]',
};

export const Dot = ({ className, color, label, ...spanProps }: DotProps) => {
  return (
    <span
      aria-label={label}
      className={`
        rounded-full inline-block flex-none
        h-[0.8rem] w-[0.8rem] m-0 p-0
        ${colorClasses[color]}
        ${className ?? ''}
      `}
      role="status"
      {...spanProps}
    />
  );
};
