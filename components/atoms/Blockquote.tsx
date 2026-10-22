import type { FunctionComponent, JSX } from 'react';

export const Blockquote: FunctionComponent<
  JSX.IntrinsicElements['blockquote']
> = ({ className, ...blockquoteProps }) => (
  <blockquote
    className={`
      border-l-2 border-blockquote-border
      m-auto w-full max-w-content p-4 pr-0
      ${className ?? ''}
    `}
    {...blockquoteProps}
  />
);
