import type { FunctionComponent, JSX } from 'react';

export const Blockquote: FunctionComponent<
  JSX.IntrinsicElements['blockquote']
> = ({ className, ...blockquoteProps }) => (
  <blockquote
    className={`
      border-l-2 border-blockquote-border
      m-auto w-full max-w-lg p-4 pr-0 text-lg
      ${className ?? ''}
    `}
    {...blockquoteProps}
  />
);
