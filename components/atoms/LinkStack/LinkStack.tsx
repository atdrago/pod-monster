import Link, { LinkProps } from 'next/link';

import { Stack } from 'components/layouts/Stack';
import type { StackProps } from 'types';

type LinkStackProps = (StackProps & LinkProps) | StackProps;

/**
 * Allows all properties of both `Link` and `Stack`. Helpful when showing
 * different pieces of info together, that conditionally has a URL associated
 * with it. One example of this is the People section on the Episode page.
 */
export const LinkStack = ({
  children,
  className,
  ...props
}: LinkStackProps) => {
  const baseClassName = `no-underline ${className ?? ''}`;

  return 'href' in props ? (
    <Stack as={Link} className={baseClassName} {...props}>
      {children}
    </Stack>
  ) : (
    <Stack className={baseClassName} {...props}>
      {children}
    </Stack>
  );
};
