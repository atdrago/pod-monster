import { m } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { Box } from 'react-polymorphic-box';

import {
  buttonClassName,
  inputClassName,
  meterClassName,
} from './sizeField.css';

interface ISizeFieldProps {
  label: string;
  max: number;
  min: number;
  onChange?: (value: number) => void;
  step: number;
  value: number;
}

export const SizeField = ({
  label,
  max,
  min,
  onChange,
  step,
  value,
}: ISizeFieldProps) => {
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
      className={buttonClassName}
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
        className={inputClassName}
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
        className={meterClassName}
      />
    </Box>
  );
};
