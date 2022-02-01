import { ExternalLink } from 'components/atoms/ExternalLink';
import { Link } from 'components/atoms/Link';
import { Typography } from 'components/atoms/Typography';
import { Stack } from 'components/layouts/Stack';

import { footerList } from './footer.css';

export const Footer = () => {
  return (
    <footer>
      <nav>
        <Stack as="ul" kind="flexRow" className={footerList}>
          <li>
            <Typography as={Link} href="/about" size="paragraph">
              About
            </Typography>
          </li>
          <li>
            <Typography as={Link} href="/settings" size="paragraph">
              Settings
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
