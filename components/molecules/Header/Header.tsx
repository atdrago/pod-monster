import type { FunctionComponent } from 'react';

import { Link } from 'components/atoms/Link';
import { Nav } from 'components/atoms/Nav';
import { Typography } from 'components/atoms/Typography';
import { Stack } from 'components/layouts/Stack';
import { headingLink, navLink } from 'styles';

export const Header: FunctionComponent = () => {
  return (
    <Stack>
      <Typography as="h1" size="headingLarge" textAlign="center">
        <Link href="/" className={headingLink}>
          🐡
        </Link>
      </Typography>
      <Nav>
        <Link href="/about" className={navLink}>
          About
        </Link>
      </Nav>
    </Stack>
  );
};
