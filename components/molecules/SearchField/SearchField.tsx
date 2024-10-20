import { type ReactNode, useRef } from 'react';

import { Typography } from 'components/atoms/Typography';
import { Stack } from 'components/layouts/Stack';
import { useUniqueId } from 'hooks/useUniqueId';

import {
  clearButton,
  fieldContainer,
  inputFeedback,
  inputField,
  inputLabel,
} from './searchField.css';

type SearchFieldProps = JSX.IntrinsicElements['input'] & {
  feedback?: string | null;
  label?: ReactNode;
  type?: 'search' | 'text';
};

export const SearchField = ({
  className,
  feedback,
  label,
  onChange,
  type = 'text',
  value,
  ...inputProps
}: SearchFieldProps) => {
  const id = useUniqueId();
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <Stack
      as="form"
      className={className}
      maxWidth="small"
      space="small"
      onSubmit={(event: React.FormEvent) => {
        event.preventDefault();
      }}
    >
      {label && (
        <Typography
          as="label"
          className={inputLabel}
          htmlFor={id}
          size="paragraph"
        >
          {label}
          <span className={inputFeedback}>{feedback}</span>
        </Typography>
      )}
      <div className={fieldContainer}>
        <input
          className={inputField}
          id={id}
          onChange={onChange}
          ref={inputRef}
          type={type}
          value={value}
          {...inputProps}
        />
        <button
          type="reset"
          aria-label="Clear search field"
          className={clearButton}
          onClick={() => {
            if (onChange && inputRef.current) {
              const event = new Event('input', {
                bubbles: true,
                cancelable: false,
              });

              Object.getOwnPropertyDescriptor(
                window.HTMLInputElement.prototype,
                'value',
              )?.set?.call(inputRef.current, '');

              inputRef.current.dispatchEvent(event);
            }
          }}
        >
          &times;
        </button>
      </div>
    </Stack>
  );
};
