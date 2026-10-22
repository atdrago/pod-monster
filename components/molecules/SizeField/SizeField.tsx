import { m } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { Box } from 'react-polymorphic-box';

interface SizeFieldProps {
  className?: string;
  label: string;
  max: number;
  min: number;
  onChange?: (value: number) => void;
  step: number;
  value: number;
}

export const SizeField = ({
  className,
  label,
  max,
  min,
  onChange,
  step,
  value,
}: SizeFieldProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (inputRef.current?.valueAsNumber) {
      inputRef.current.valueAsNumber = value;
    }
  }, [value]);

  return (
    <Box
      as="button"
      aria-label={label}
      className={`
        flex flex-col items-stretch justify-end justify-self-end
        m-0 h-6 w-4 p-px
        border-2 border-foreground bg-transparent
        cursor-pointer
        ${className ?? ''}
      `}
      onClick={() => {
        if (onChange && inputRef.current) {
          if (value === max) {
            inputRef.current.valueAsNumber = min;
          } else {
            inputRef.current.stepUp();
          }

          onChange(inputRef.current.valueAsNumber);
        }
      }}
    >
      <input
        className="hidden"
        max={max}
        min={min}
        ref={inputRef}
        step={step}
        type="range"
        defaultValue={value}
      />
      <m.span
        animate={{ height: `${(value / max) * 100}%` }}
        transition={{ damping: 15, mass: 0.1, stiffness: 500, type: 'spring' }}
        aria-hidden={true}
        className="m-0 block bg-foreground p-0"
      />
    </Box>
  );
};
