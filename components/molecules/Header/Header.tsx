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

interface HeaderProps {
  className?: string;
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
  className,
  episode,
  feed,
  isLoading = false,
}) => {
  const pathname = usePathname() ?? '';

  const feedTitle = episode?.feedTitle ?? feed?.title;
  const feedUrl = episode?.feedUrl ?? feed?.url;

  const isStaticPage = pathname === '/about';

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
      align="center"
      justify="center"
      className={`-mt-[5px] -mb-[6px] ${className ?? ''}`}
    >
      <Typography
        as="h1"
        size="headingSmall"
        width="auto"
        shouldTrimTextBox={false}
        className="flex-none font-bold"
      >
        {/* The negative margin and the padding make the touch area larger,
            but the layout box keeps its size. */}
        <Link
          aria-label="Pod Monster"
          href="/"
          className="
            inline-flex flex-col items-center gap-3
            -my-2 -mx-4 py-2 px-4
            no-underline
          "
        >
          <Icon size="large" aria-hidden="true">
            <LogoIcon className="animate-logo" />
          </Icon>
          {isAppNameHidden ? null : 'Pod Monster'}
        </Link>
      </Typography>
      {isStaticPage ? (
        <>
          <Typography
            as="span"
            size="headingSmall"
            width="auto"
            className="flex-none"
          >
            {' / '}
          </Typography>
          <Typography
            as="h2"
            className="flex-initial font-bold"
            size="headingSmall"
            whitespace="ellipsis"
            width="auto"
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
            width="auto"
            className="flex-none"
          >
            {' / '}
          </Typography>
          <Typography
            as="h2"
            className={`${isEpisodeTitleVisible ? 'flex-none' : 'flex-initial'} font-bold`}
            size="headingSmall"
            whitespace="ellipsis"
            width="auto"
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
            width="auto"
            className="flex-none"
          >
            {' / '}
          </Typography>
          <Typography
            as="h3"
            className="flex-initial font-bold"
            size="headingSmall"
            whitespace="ellipsis"
            width="auto"
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
