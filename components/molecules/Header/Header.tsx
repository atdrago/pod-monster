'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { FunctionComponent } from 'react';

import { Icon } from 'components/atoms/Icon';
import { Typography } from 'components/atoms/Typography';
import { Stack } from 'components/layouts/Stack';
import LogoIcon from 'icons/logo.svg';
import type { PodcastEpisode, PodcastFeed } from 'types/PodcastFeed';
import { getEpisodePath, getPodcastPath } from 'utils/paths';
import { toTitleCase } from 'utils/toTitleCase';

import {
  headerBaseClassName,
  homeIconClassName,
  homeLinkClassName,
} from './header.css';

interface HeaderProps {
  /**
   * Set on the page of an episode. The episode also gives the title and the
   * URL of its show, so the page of an episode does not set `feed`.
   */
  episode?: Pick<
    PodcastEpisode,
    'feedTitle' | 'feedUrl' | 'identity' | 'title'
  >;
  /** Set on the page of a show. */
  feed?: Pick<PodcastFeed, 'title' | 'url'>;
  isLoading?: boolean;
}

export const Header: FunctionComponent<HeaderProps> = ({
  episode,
  feed,
  isLoading = false,
}) => {
  const pathname = usePathname() ?? '';

  const feedTitle = episode?.feedTitle ?? feed?.title;
  const feedUrl = episode?.feedUrl ?? feed?.url;

  const isStaticPage = ['/about', '/settings'].includes(pathname);

  const isAppNameHidden = isStaticPage || isLoading || feedTitle || feedUrl;

  const isFeedTitleVisible =
    !isStaticPage && (isLoading || (feedUrl && feedTitle));

  const isEpisodeTitleVisible =
    !isStaticPage && !isLoading && feedUrl && feedTitle && episode?.title;

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
        shouldTrimTextBox={false}
        className="font-bold"
      >
        <Link aria-label="Pod Monster" href="/" className={homeLinkClassName}>
          <Icon size="large" aria-hidden="true">
            <LogoIcon className={homeIconClassName} />
          </Icon>
          {isAppNameHidden ? null : 'Pod Monster'}
        </Link>
      </Typography>
      {isStaticPage ? (
        <>
          <Typography
            as="span"
            size="headingSmall"
            style={{ flex: '0 0 auto', margin: 0, width: 'auto' }}
            shouldTrimTextBox={false}
          >
            {' / '}
          </Typography>
          <Typography
            as="h2"
            className="font-bold"
            size="headingSmall"
            whitespace="ellipsis"
            style={{
              flex: isEpisodeTitleVisible ? '0 0 auto' : '0 1 auto',
              margin: 0,
              width: 'auto',
            }}
            shouldTrimTextBox={false}
            title={feedTitle}
          >
            <Link href={pathname} className="no-underline hover:underline">
              {toTitleCase(pathname.slice(1))}
            </Link>
          </Typography>
        </>
      ) : null}
      {isFeedTitleVisible ? (
        <>
          <Typography
            as="span"
            size="headingSmall"
            style={{ flex: '0 0 auto', margin: 0, width: 'auto' }}
            shouldTrimTextBox={false}
          >
            {' / '}
          </Typography>
          <Typography
            as="h2"
            className="font-bold"
            size="headingSmall"
            whitespace="ellipsis"
            style={{
              flex: isEpisodeTitleVisible ? '0 0 auto' : '0 1 auto',
              margin: 0,
              width: 'auto',
            }}
            shouldTrimTextBox={false}
            title={feedTitle}
          >
            {isLoading ? (
              'Loading...'
            ) : feedUrl ? (
              <Link
                href={getPodcastPath({ feedUrl })}
                className="no-underline hover:underline"
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
            shouldTrimTextBox={false}
          >
            {' / '}
          </Typography>
          <Typography
            as="h3"
            className="font-bold"
            size="headingSmall"
            whitespace="ellipsis"
            style={{ flex: '0 1 auto', margin: 0, width: 'auto' }}
            shouldTrimTextBox={false}
            title={episode.title}
          >
            <Link
              href={getEpisodePath({
                episodeIdentity: episode.identity,
                feedUrl,
              })}
              className="no-underline hover:underline"
            >
              {episode.title}
            </Link>
          </Typography>
        </>
      ) : null}
    </Stack>
  );
};
