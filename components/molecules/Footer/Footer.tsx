import Link from 'next/link';

import { ExternalLink } from 'components/atoms/ExternalLink';
import { Typography } from 'components/atoms/Typography';
import { Stack } from 'components/layouts/Stack';

interface FooterProps {
  className?: string;
}

export const Footer = ({ className }: FooterProps) => {
  return (
    <footer className={className}>
      <nav>
        <Stack as="ul" kind="flexRow">
          <li>
            <Typography as={Link} href="/" size="paragraph">
              Home
            </Typography>
          </li>
          <li>
            <Typography as={Link} href="/about" size="paragraph">
              About
            </Typography>
          </li>
          <li>
            <Typography
              as={ExternalLink}
              href="https://github.com/atdrago/pod-monster"
              size="paragraph"
            >
              GitHub
            </Typography>
          </li>
        </Stack>
      </nav>
    </footer>
  );
};
