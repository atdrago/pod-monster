import { useRouter } from 'next/router';
import { ChangeEventHandler, FunctionComponent, useState } from 'react';
import { QueryClient, dehydrate, useQuery } from 'react-query';

import { getAuthValues, searchByTerm } from '@atdrago/podcast-index';
import { Artwork } from 'components/atoms/Artwork';
import { Checkbox } from 'components/atoms/Checkbox';
import { Head } from 'components/atoms/Head';
import { LinkStack } from 'components/atoms/LinkStack';
import { SubscribeButton } from 'components/atoms/SubscribeButton';
import { Typography } from 'components/atoms/Typography';
import { Stack } from 'components/layouts/Stack';
import { SearchField } from 'components/molecules/SearchField';
import { SubscriptionItem } from 'components/molecules/SubscriptionItem';
import { useSettingsContext } from 'contexts/SettingsContext';
import { useStateWithDebounce } from 'hooks/useStateWithDebounce';
import type { IPodcastsPageProps, PodcastsPageGetServerSideProps } from 'types';
import { getPodcastIndexConfig } from 'utils/getPodcastIndexConfig';
import { getProxyImageUrl } from 'utils/getProxyImageUrl';
import { getPodcastPath } from 'utils/paths';

export const getServerSideProps: PodcastsPageGetServerSideProps = async ({
  query,
  res,
}) => {
  const queryClient = new QueryClient();
  const [authTime, authToken] = getAuthValues(
    process.env.NEXT_PUBLIC_PODCAST_INDEX_API_KEY,
    process.env.NEXT_PUBLIC_PODCAST_INDEX_API_SECRET
  );

  const searchTerm = typeof query.term === 'string' ? query.term : null;

  if (searchTerm) {
    await queryClient.prefetchQuery(
      ['searchByTerm', searchTerm],
      async () =>
        await searchByTerm(
          searchTerm,
          getPodcastIndexConfig(authTime, authToken)
        )
    );
  }

  // Stay fresh for 24 hours, and stale for 30 days
  res.setHeader(
    'Cache-Control',
    'public, s-maxage=86400, stale-while-revalidate=2592000'
  );

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      initialSearchTerm: searchTerm,
      podcastIndexAuthTime: authTime,
      podcastIndexAuthToken: authToken,
    },
  };
};

const HomePage: FunctionComponent<IPodcastsPageProps> = ({
  initialSearchTerm,
  podcastIndexAuthTime,
  podcastIndexAuthToken,
}) => {
  const router = useRouter();
  const { feedSettings } = useSettingsContext();
  const [shouldIncludeDeadFeeds, setShouldIncludeDeadFeeds] = useState(false);
  const [searchTerm, searchTermDebounced, setSearchTerm] = useStateWithDebounce(
    initialSearchTerm ?? '',
    1000
  );

  const { data: searchResponse, isLoading } = useQuery(
    ['searchByTerm', searchTermDebounced],
    async () =>
      await searchByTerm(
        searchTermDebounced,
        getPodcastIndexConfig(podcastIndexAuthTime, podcastIndexAuthToken)
      ),
    {
      enabled: !!searchTermDebounced,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    }
  );

  const handleSearchChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    setSearchTerm(event.currentTarget.value);
    router.replace(`?term=${event.currentTarget.value}`);
  };

  const isSearchEmpty = /^\s*$/.test(searchTerm);

  const isSearchLoading =
    (isLoading || searchTermDebounced !== searchTerm) && !isSearchEmpty;

  const feedSettingsEntries = Object.entries(feedSettings).filter(
    ([_, { subscribedAt }]) => {
      return !!subscribedAt;
    }
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

  return (
    <>
      <Head
        titles={['Podcasts']}
        description="Search for and subscribe to podcasts"
      />
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
                      href={getPodcastPath({ id: `${feed.id}` })}
                      kind="flexRow"
                      space="small"
                      align="center"
                      style={{ flex: '0 1 auto', minWidth: '0' }}
                    >
                      <Artwork
                        alt=""
                        width={80}
                        height={80}
                        src={getProxyImageUrl(feed.image)}
                        shadow="medium"
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
                      feedId={feed.id}
                      feedType={feed.type === 0 ? 'rss' : 'atom'}
                      htmlUrl={feed.link}
                      image={feed.image}
                      title={feed.title}
                      xmlUrl={feed.url}
                    />
                  </Stack>
                );
              })}
            </Stack>
          )}
          {feedSettingsEntries.length > 0 && (
            <Stack space="small">
              <Typography as="h2" size="headingSmall">
                Subscriptions
              </Typography>
              {feedSettingsEntries.map(([feedId, { image, title }]) => {
                return (
                  <SubscriptionItem
                    key={feedId}
                    feedId={feedId}
                    image={image}
                    title={title}
                  />
                );
              })}
            </Stack>
          )}
        </Stack>
      </Stack>
    </>
  );
};

export default HomePage;
