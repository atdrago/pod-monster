import { type ReactNode, useRef, type JSX, useId } from 'react';

import { Typography } from 'components/atoms/Typography';
import { Stack } from 'components/layouts/Stack';

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
  const id = useId();
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
          className="relative"
          htmlFor={id}
          size="paragraph"
        >
          {label}
          <span className="absolute right-0">{feedback}</span>
        </Typography>
      )}
      <div className="relative">
        <input
          className="
            peer w-full p-2
            border-2 border-button-border rounded-none
            bg-background text-foreground text-paragraph
            [&::-webkit-search-cancel-button]:hidden
            [&::-webkit-search-decoration]:hidden
          "
          id={id}
          onChange={onChange}
          ref={inputRef}
          type={type}
          value={value}
          {...inputProps}
        />
        {/* The 2px right offset matches the border of the input. */}
        <button
          type="reset"
          aria-label="Clear search field"
          className="
            absolute inset-y-0 right-0.5 block m-auto px-3
            border-0 bg-transparent cursor-pointer
            text-heading-smaller leading-none font-bold text-center text-foreground
            peer-placeholder-shown:hidden
          "
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
