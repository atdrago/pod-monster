import { useRouter } from 'next/router';
import { ChangeEventHandler, FunctionComponent, useEffect } from 'react';
import { QueryClient, dehydrate, useQuery } from 'react-query';

import { Artwork } from 'components/atoms/Artwork';
import { Head } from 'components/atoms/Head';
import { Link } from 'components/atoms/Link';
import { Typography } from 'components/atoms/Typography';
import { Stack } from 'components/layouts/Stack';
import { InputField } from 'components/molecules/InputField';
import { SubscriptionItem } from 'components/molecules/SubscriptionItem';
import { useSettingsContext } from 'contexts/SettingsContext';
import { useStateWithDebounce } from 'hooks/useStateWithDebounce';
import { fetchPodcastIndexAuth } from 'rest/fetchPodcastIndexAuth';
import { nonUnderlinedLink } from 'styles';
import type { IPodcastsPageProps, PodcastsPageGetServerSideProps } from 'types';
import { getPodcastIndexConfig } from 'utils/getPodcastIndexConfig';
import { getPodcastPath } from 'utils/paths';
import { searchByTerm, setConfig } from 'utils/podcastIndex';

export const getServerSideProps: PodcastsPageGetServerSideProps = async ({
  query,
  res,
}) => {
  const queryClient = new QueryClient();
  const [authTime, authToken] = await fetchPodcastIndexAuth();

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

    // If a search term is present, stay fresh for 60 seconds, stale for 1 hour
    res.setHeader(
      'Cache-Control',
      'public, s-maxage=60, stale-while-revalidate=3600'
    );
  } else {
    // If no search term, stay fresh for 1 hour, and stale for 12 hours
    res.setHeader(
      'Cache-Control',
      'public, s-maxage=3600, stale-while-revalidate=43200'
    );
  }

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
  const [searchTerm, searchTermDebounced, setSearchTerm] = useStateWithDebounce(
    initialSearchTerm ?? '',
    1000
  );

  const { data: searchResponse, isLoading } = useQuery(
    ['searchByTerm', searchTermDebounced],
    async () => await searchByTerm(searchTermDebounced),
    {
      enabled: !!searchTermDebounced,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    }
  );

  useEffect(() => {
    setConfig(
      getPodcastIndexConfig(podcastIndexAuthTime, podcastIndexAuthToken)
    );
  }, [podcastIndexAuthTime, podcastIndexAuthToken]);

  const handleSearchChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    setSearchTerm(event.currentTarget.value);
    router.replace(`?term=${event.currentTarget.value}`);
  };

  const isSearchLoading = isLoading || searchTermDebounced !== searchTerm;

  const feedSettingsEntries = Object.entries(feedSettings).filter(
    ([_, { subscribedAt }]) => {
      return !!subscribedAt;
    }
  );

  let searchFeedback = searchResponse
    ? `${searchResponse.description} ${
        searchResponse.count > 0 ? `(${searchResponse.count})` : ''
      }`
    : '';

  if (isSearchLoading) {
    searchFeedback = 'Loading...';
  }

  return (
    <>
      <Head
        titles={['Podcasts']}
        description="Search for and subscribe to podcasts"
      />
      <Stack as="main">
        {/* <Typography as="p" size="headingMedium">
          Welcome to Pod Monster, an application powered by the Podcast Index.
        </Typography>
        <Typography as="p" size="paragraph">
          You&apos;re seeing this message because it looks like it&apos;s your
          first time here. If it isn&apos;t your first time here, you may have
          Private Browsing enabled, or your settings may have been erased by the
          browser.
        </Typography> */}
        <Stack maxWidth="small">
          <InputField
            feedback={searchFeedback}
            label={
              <Typography
                as="h2"
                size="headingSmall"
                style={{ display: 'inline-block' }}
              >
                Search
              </Typography>
            }
            type="search"
            value={searchTerm}
            onChange={handleSearchChange}
          />
          {searchResponse && (
            <Stack space="small">
              {searchResponse.feeds.map((feed, index) => {
                const proxyFeedImage = new URL(
                  '/api/images/proxy',
                  process.env.NEXT_PUBLIC_BASE_URL
                );

                proxyFeedImage.searchParams.set('url', feed.image ?? '');

                return (
                  <Stack
                    as={Link}
                    className={nonUnderlinedLink}
                    key={feed.id}
                    kind="flexRow"
                    space="small"
                    href={getPodcastPath({ id: `${feed.id}` })}
                    align="center"
                  >
                    <Artwork
                      alt={`${index + 1}. `}
                      width={80}
                      height={80}
                      src={proxyFeedImage.toString()}
                      shadow="medium"
                      label={`${index + 1}.`}
                    />
                    <Stack
                      space="small"
                      style={{
                        overflowY: 'hidden',
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
