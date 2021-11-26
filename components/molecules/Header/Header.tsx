import type { FunctionComponent } from 'react';

import { Icon } from 'components/atoms/Icon';
import { Link } from 'components/atoms/Link';
import { Typography } from 'components/atoms/Typography';
import HomeIcon from 'icons/home.svg';
import { headingLink } from 'styles';
import { getPodcastPath } from 'utils/paths';

import { headerBaseClassName, homeLinkClassName } from './header.css';

interface IHeaderProps {
  feedId?: number | string;
  feedTitle?: string;
}

export const Header: FunctionComponent<IHeaderProps> = ({
  feedId,
  feedTitle,
}) => {
  return (
    <div className={headerBaseClassName}>
      <Typography
        as="h1"
        size="headingSmall"
        style={{ flex: '0 0 auto', margin: 0, width: 'auto' }}
        shouldUseCapsize={false}
      >
        <Link aria-label="podcast.fish" href="/" className={homeLinkClassName}>
          <Icon size="small">
            <HomeIcon />
          </Icon>
        </Link>
      </Typography>
      {feedId && feedTitle ? (
        <>
          <Typography
            as="span"
            size="headingSmall"
            style={{ flex: '0 0 auto', margin: 0, width: 'auto' }}
            shouldUseCapsize={false}
          >
            {' / '}
          </Typography>
          <Typography
            as="h2"
            size="headingSmall"
            whitespace="ellipsis"
            style={{ flex: '0 1 auto', margin: 0, width: 'auto' }}
            shouldUseCapsize={false}
          >
            <Link href={getPodcastPath({ id: feedId })} className={headingLink}>
              {feedTitle}
            </Link>
          </Typography>
        </>
      ) : null}
    </div>
  );
};
