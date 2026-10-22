'use client';

import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { ChangeEventHandler, useState } from 'react';

import { searchByTerm } from '@atdrago/podcast-index';
import { Artwork } from 'components/atoms/Artwork';
import { Checkbox } from 'components/atoms/Checkbox';
import { LinkStack } from 'components/atoms/LinkStack';
import { SubscribeButton } from 'components/atoms/SubscribeButton';
import { Typography } from 'components/atoms/Typography';
import { Stack } from 'components/layouts/Stack';
import { Header } from 'components/molecules/Header';
import { SearchField } from 'components/molecules/SearchField';
import { SubscriptionItem } from 'components/molecules/SubscriptionItem';
import { useSettingsContext } from 'contexts/SettingsContext';
import { useStateWithDebounce } from 'hooks/useStateWithDebounce';
import { getPodcastIndexConfig } from 'utils/getPodcastIndexConfig';
import { getPodcastPath } from 'utils/paths';
import { fetchPodcastEpisodes } from 'rest/fetchPodcastEpisodes';

interface HomePageProps {
  podcastIndexAuthTime: number;
  podcastIndexAuthToken: string;
}

export function HomePage({
  podcastIndexAuthTime,
  podcastIndexAuthToken,
}: HomePageProps) {
  const { feedSettings } = useSettingsContext();
  const [shouldIncludeDeadFeeds, setShouldIncludeDeadFeeds] = useState(false);
  const searchParams = useSearchParams();
  const [searchTerm, searchTermDebounced, setSearchTerm] = useStateWithDebounce(
    searchParams?.get('term') ?? '',
    1000,
  );

  const { data: searchResponse, isLoading } = useQuery({
    enabled: !!searchTermDebounced,
    queryFn: async () =>
      await searchByTerm(
        searchTermDebounced,
        getPodcastIndexConfig(podcastIndexAuthTime, podcastIndexAuthToken),
      ),
    queryKey: ['searchByTerm', searchTermDebounced],
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const handleSearchChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    setSearchTerm(event.currentTarget.value);
    window.history.replaceState({}, '', `?term=${event.currentTarget.value}`);
  };

  const isSearchEmpty = /^\s*$/.test(searchTerm);

  const isSearchLoading =
    (isLoading || searchTermDebounced !== searchTerm) && !isSearchEmpty;

  const feedSettingsEntries = Object.entries(feedSettings).filter(
    ([_, { subscribedAt }]) => {
      return !!subscribedAt;
    },
  );

  let searchFeedback =
    searchResponse && !isSearchEmpty
      ? `${searchResponse.description} ${
          searchResponse.count > 0 ? `(${searchResponse.count})` : ''
        }`
      : '';

  if (isSearchLoading) {
    searchFeedback = 'Loading...';
  }

  const hasDeadFeeds =
    searchResponse && searchResponse.feeds.some((feed) => feed.dead > 0);

  // The refresh sends Podcast Index feed ids only, so that no feed URL goes
  // into a query string. A show with no id gets no new episodes dot.
  const subscribedPodcastIndexFeedIds = Array.from(
    new Set(
      feedSettingsEntries.flatMap(([_, { podcastIndexId }]) =>
        podcastIndexId === undefined ? [] : [podcastIndexId],
      ),
    ),
  ).sort((left, right) => left - right);

  // -30 days
  const since = -30 * 24 * 60 * 60;

  const { data: feedEpisodesData } = useQuery({
    enabled: subscribedPodcastIndexFeedIds.length > 0,
    queryFn: () => fetchPodcastEpisodes(subscribedPodcastIndexFeedIds, since),
    queryKey: ['fetchPodcastEpisodes', subscribedPodcastIndexFeedIds, since],
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  return (
    <>
      <Header />
      <Stack as="main">
        <Stack maxWidth="small">
          <Stack space="small">
            <SearchField
              aria-label="Search"
              feedback={searchFeedback}
              onChange={handleSearchChange}
              placeholder="Search by term"
              type="search"
              value={searchTerm}
            />
            {hasDeadFeeds && (
              <Checkbox
                checked={shouldIncludeDeadFeeds}
                onChange={(event) =>
                  setShouldIncludeDeadFeeds(event.currentTarget.checked)
                }
              >
                Include &ldquo;dead&rdquo; feeds in search results
              </Checkbox>
            )}
          </Stack>
          {searchResponse && !isSearchEmpty && (
            <Stack as={'ol'} space="small">
              {searchResponse.feeds.map((feed, index) => {
                if (feed.dead) {
                  return null;
                }

                return (
                  <Stack
                    as="li"
                    key={feed.id}
                    kind="flexRow"
                    space="small"
                    align="center"
                  >
                    <LinkStack
                      href={getPodcastPath({ feedUrl: feed.url })}
                      kind="flexRow"
                      space="small"
                      align="center"
                      style={{ flex: '0 1 auto', minWidth: '0' }}
                    >
                      <Artwork
                        alt=""
                        width={80}
                        height={80}
                        src={feed.image}
                        shadow={true}
                        label={`${index + 1}.`}
                      />
                      <Stack
                        space="small"
                        style={{
                          overflow: 'hidden',
                          padding: '4px 0',
                        }}
                      >
                        <Typography
                          as="h2"
                          size="headingSmaller"
                          whitespace="ellipsis"
                          className="font-bold"
                        >
                          {feed.title}
                        </Typography>
                        {feed.author ? (
                          <Typography
                            as="p"
                            size="paragraph"
                            whitespace="ellipsis"
                          >
                            {feed.author}
                          </Typography>
                        ) : null}
                      </Stack>
                    </LinkStack>
                    <SubscribeButton
                      feed={{
                        format: feed.type === 0 ? 'rss' : 'atom',
                        image: feed.image,
                        link: feed.link,
                        podcastIndexId: feed.id,
                        title: feed.title,
                        url: feed.url,
                      }}
                    />
                  </Stack>
                );
              })}
            </Stack>
          )}
          {feedSettingsEntries.length > 0 && (
            <Stack space="small">
              <Typography as="h2" size="headingSmall" className="font-bold">
                Subscriptions
              </Typography>
              {feedSettingsEntries.map(
                ([feedUrl, { image, podcastIndexId, title }]) => {
                  return (
                    <SubscriptionItem
                      key={feedUrl}
                      feedEpisodesData={
                        podcastIndexId === undefined
                          ? undefined
                          : feedEpisodesData?.items.filter(
                              ({ feedId }) => feedId === podcastIndexId,
                            )
                      }
                      feedUrl={feedUrl}
                      image={image}
                      title={title}
                    />
                  );
                },
              )}
            </Stack>
          )}
        </Stack>
      </Stack>
    </>
  );
}
