import type { FunctionComponent } from 'react';

import { Icon } from 'components/atoms/Icon';
import { Link } from 'components/atoms/Link';
import { Typography } from 'components/atoms/Typography';
import LogoIcon from 'icons/logo.svg';
import { headingLink } from 'styles';
import { getEpisodePath, getPodcastPath } from 'utils/paths';

import {
  headerBaseClassName,
  homeIconClassName,
  homeLinkClassName,
} from './header.css';

interface IHeaderProps {
  episodeId?: number | string;
  episodeTitle?: string;
  feedId?: number | string;
  feedTitle?: string;
  isLoading?: boolean;
}

export const Header: FunctionComponent<IHeaderProps> = ({
  episodeId,
  episodeTitle,
  feedId,
  feedTitle,
  isLoading = false,
}) => {
  return (
    <div className={headerBaseClassName}>
      <Typography
        as="h1"
        size="headingSmall"
        style={{ flex: '0 0 auto', margin: 0, width: 'auto' }}
        shouldUseCapsize={false}
      >
        <Link
          anchorProps={{ 'aria-label': process.env.NEXT_PUBLIC_APP_NAME }}
          href="/"
          className={homeLinkClassName}
        >
          <Icon size="large">
            <LogoIcon className={homeIconClassName} />
          </Icon>
          {feedTitle || feedId ? null : process.env.NEXT_PUBLIC_APP_NAME}
        </Link>
      </Typography>
      {isLoading || (feedId && feedTitle) ? (
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
            {isLoading ? (
              'Loading...'
            ) : feedId ? (
              <Link
                href={getPodcastPath({ id: feedId })}
                className={headingLink}
              >
                {feedTitle}
              </Link>
            ) : (
              ''
            )}
          </Typography>
        </>
      ) : null}
      {!isLoading && feedId && feedTitle && episodeId && episodeTitle ? (
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
            <Link
              href={getEpisodePath({ episodeId, feedId })}
              className={headingLink}
            >
              {episodeTitle}
            </Link>
          </Typography>
        </>
      ) : null}
    </div>
  );
};
