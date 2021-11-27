import type { LinkProps } from 'next/link';
import type { PropsWithChildren } from 'react';

export interface ILinkProps extends PropsWithChildren<unknown> {
  anchorProps?: Omit<JSX.IntrinsicElements['a'], 'href'>;
  className?: string;
  href: LinkProps['href'];
  linkProps?: Omit<LinkProps, 'href'>;
}
