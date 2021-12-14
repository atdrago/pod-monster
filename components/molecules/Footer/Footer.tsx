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
            <Typography as={Link} href="/settings" size="paragraph">
              Settings
            </Typography>
          </li>
        </Stack>
      </nav>
    </footer>
  );
};
