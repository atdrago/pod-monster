import NextLink from 'next/link';
import type { LinkProps } from 'next/link';
import type { FunctionComponent, PropsWithChildren } from 'react';

interface ILinkProps extends PropsWithChildren<unknown> {
  anchorProps?: Omit<JSX.IntrinsicElements['a'], 'href'>;
  className?: string;
  href: LinkProps['href'];
  linkProps?: Omit<LinkProps, 'href'>;
}

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
