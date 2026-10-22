import type { JSX } from 'react';

type RangeProps = JSX.IntrinsicElements['input'] & {
  variant: 'volume' | 'audio';
};

const variantClasses = {
  audio:
    'slider-thumb:m-0 slider-thumb:h-full slider-thumb:w-6 slider-thumb:rounded-none slider-thumb:border-0 slider-thumb:p-0 slider-track:box-border slider-track:h-8 slider-track:border-2 slider-track:border-foreground slider-track:bg-background',
  volume:
    'slider-thumb:-mt-[calc((16px-2px)/2)] slider-thumb:size-4 slider-thumb:rounded-full slider-track:h-0.5 slider-track:border-0 slider-track:bg-foreground',
} as const;

export const Range = ({ className, variant, ...rangeProps }: RangeProps) => (
  <input
    type="range"
    className={`m-0 h-8 w-full appearance-none bg-transparent p-0 slider-thumb:cursor-pointer slider-thumb:appearance-none slider-thumb:bg-foreground slider-thumb:shadow-none slider-track:w-full slider-track:cursor-pointer slider-track:rounded-none slider-track:shadow-none ${variantClasses[variant]} ${className ?? ''}`}
    {...rangeProps}
  />
);
