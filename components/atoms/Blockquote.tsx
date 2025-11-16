import type { FunctionComponent, JSX } from 'react';

export const Blockquote: FunctionComponent<
  JSX.IntrinsicElements['blockquote']
> = ({ className, ...blockquoteProps }) => (
  <blockquote
    className={`
      border-l-2 border-zinc-400 dark:border-zinc-600
      m-auto w-full max-w-lg p-4 pr-0 text-lg
      ${className}
    `}
    {...blockquoteProps}
  />
);
