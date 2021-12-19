import NextLink from 'next/link';
import type { FunctionComponent } from 'react';

import type { ILinkProps } from 'types';

export const Link: FunctionComponent<ILinkProps> = ({
  anchorProps,
  children,
  className,
  href,
  linkProps,
}) => {
  return (
    <NextLink href={href} {...linkProps}>
      {/* Links in Next forward their `href` to the anchor */}
      {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
      <a {...anchorProps} className={className}>
        {children}
      </a>
    </NextLink>
  );
};
