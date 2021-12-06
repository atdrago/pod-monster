import type { FunctionComponent } from 'react';

import { Icon } from 'components/atoms/Icon';
import { Link } from 'components/atoms/Link';
import { Typography } from 'components/atoms/Typography';
import { Stack } from 'components/layouts/Stack';
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
  const isEpisodeTitleVisible =
    !isLoading && feedId && feedTitle && episodeId && episodeTitle;

  const abbreviatedFeedTitle = isEpisodeTitleVisible
    ? feedTitle
        ?.replace(/(\w)\w+/g, '$1')
        .replace(/\s*/g, '')
        .toUpperCase()
    : feedTitle;

  return (
    <Stack
      maxWidth="small"
      space="small"
      as="header"
      kind="flexRow"
      className={headerBaseClassName}
    >
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
          {isLoading || feedTitle || feedId
            ? null
            : process.env.NEXT_PUBLIC_APP_NAME}
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
            style={{
              flex: isEpisodeTitleVisible ? '0 0 auto' : '0 1 auto',
              margin: 0,
              width: 'auto',
            }}
            shouldUseCapsize={false}
            title={feedTitle}
          >
            {isLoading ? (
              'Loading...'
            ) : feedId ? (
              <Link
                href={getPodcastPath({ id: feedId })}
                className={headingLink}
              >
                {abbreviatedFeedTitle}
              </Link>
            ) : (
              ''
            )}
          </Typography>
        </>
      ) : null}
      {isEpisodeTitleVisible ? (
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
            as="h3"
            size="headingSmall"
            whitespace="ellipsis"
            style={{ flex: '0 1 auto', margin: 0, width: 'auto' }}
            shouldUseCapsize={false}
            title={episodeTitle}
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
    </Stack>
  );
};
