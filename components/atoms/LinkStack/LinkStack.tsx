import Link, { LinkProps } from 'next/link';

import { Stack } from 'components/layouts/Stack';
import { useClassNames } from 'hooks/useClassNames';
import type { StackProps } from 'types';

import { linkStackClassName } from './linkStack.css';

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
  const baseClassName = useClassNames(linkStackClassName, className);

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
