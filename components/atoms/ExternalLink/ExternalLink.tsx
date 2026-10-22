import type { JSX } from 'react';

export const ExternalLink = ({
  children,
  className,
  ...props
}: JSX.IntrinsicElements['a']) => {
  return (
    <a
      className={`underline ${className ?? ''}`}
      target="_blank"
      rel="noreferrer noopener"
      {...props}
    >
      {children}
    </a>
  );
};
