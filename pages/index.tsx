import Head from 'next/head';
import type { ApiResponse } from 'podcastdx-client/src/types';
import {
  ChangeEventHandler,
  FunctionComponent,
  useEffect,
  useState,
} from 'react';

import { Artwork } from 'components/atoms/Artwork';
import { Link } from 'components/atoms/Link';
import { Typography } from 'components/atoms/Typography';
import { Stack } from 'components/layouts/Stack';
import { Header } from 'components/molecules/Header';
import { InputField } from 'components/molecules/InputField';
import { useSettingsContext } from 'contexts/SettingsContext';
import { useStateWithDebounce } from 'hooks/useStateWithDebounce';
import { fetchPodcastIndexAuth } from 'rest/fetchPodcastIndexAuth';
import { headingLink } from 'styles';
import type { IPodcastsPageProps, PodcastsPageGetServerSideProps } from 'types';
import { getPodcastIndexConfig } from 'utils/getPodcastIndexConfig';
import { getPodcastPath } from 'utils/paths';
import { searchByTerm, setConfig } from 'utils/podcastIndex';

export const getServerSideProps: PodcastsPageGetServerSideProps = async ({
  query,
}) => {
  const [authTime, authToken] = await fetchPodcastIndexAuth();

  let initialSearchResponse: ApiResponse.Search | null = null;

  if (typeof query.term === 'string') {
    initialSearchResponse = await searchByTerm(
      query.term,
      getPodcastIndexConfig(authTime, authToken)
    );
  }

  return {
    props: {
      initialSearchResponse,
      podcastIndexAuthTime: authTime,
      podcastIndexAuthToken: authToken,
    },
  };
};

const HomePage: FunctionComponent<IPodcastsPageProps> = ({
  initialSearchResponse,
  podcastIndexAuthTime,
  podcastIndexAuthToken,
}) => {
  const { feedSettings } = useSettingsContext();
  const [search, searchDebounced, setSearch] = useStateWithDebounce(
    initialSearchResponse?.query ?? '',
    1000
  );
  const [searchResponse, setSearchResponse] =
    useState<ApiResponse.Search | null>(initialSearchResponse);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setConfig(
      getPodcastIndexConfig(podcastIndexAuthTime, podcastIndexAuthToken)
    );
  }, [podcastIndexAuthTime, podcastIndexAuthToken]);

  useEffect(() => {
    (async () => {
      if (!searchDebounced) {
        setSearchResponse(null);

        return;
      }

      try {
        setIsLoading(true);

        const response = await searchByTerm(searchDebounced);

        if (response) {
          setSearchResponse(response);
        }
      } catch (err) {
        // TODO: Capture exception
      }

      setIsLoading(false);
    })();
  }, [searchDebounced]);

  const handleSearchChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    setSearch(event.currentTarget.value);
    window.history.replaceState(
      null,
      'Podcasts - podcast.fish',
      `?term=${event.currentTarget.value}`
    );
  };

  const isSearchLoading = isLoading || searchDebounced !== search;

  const feedSettingsEntries = Object.entries(feedSettings);

  return (
    <>
      <Head>
        <title>Podcasts - podcast.fish</title>
        <meta
          name="description"
          content="Search for and subscribe to podcasts"
        />
      </Head>
      <Header />
      <Stack maxWidth="small">
        <InputField
          feedback={isSearchLoading ? 'Loading...' : null}
          label="Search"
          type="search"
          value={search}
          onChange={handleSearchChange}
        />
        {searchResponse && (
          <Stack space="small">
            <Typography as="p" size="paragraph">
              {searchResponse.description}{' '}
              {searchResponse.count > 0 && `(${searchResponse.count})`}
            </Typography>
            {searchResponse.feeds.map((feed, index) => {
              const proxyFeedImage = new URL(
                '/api/images/proxy',
                process.env.NEXT_PUBLIC_BASE_URL
              );

              proxyFeedImage.searchParams.set('url', feed.image ?? '');

              return (
                <Stack
                  as="article"
                  key={feed.id}
                  kind="flexRow"
                  space="small"
                  align="center"
                >
                  <Artwork
                    width={80}
                    height={80}
                    src={proxyFeedImage.toString()}
                  />
                  <Typography as="h2" size="headingSmaller">
                    {`${index + 1}. `}
                    <Link
                      className={headingLink}
                      href={getPodcastPath({ id: `${feed.id}` })}
                    >
                      {feed.title}
                    </Link>
                  </Typography>
                </Stack>
              );
            })}
          </Stack>
        )}
        {feedSettingsEntries.length > 0 && (
          <Stack space="small">
            <Typography as="h4" size="headingSmall">
              Subscriptions
            </Typography>
            {feedSettingsEntries.map(([feedId, { image, title }]) => {
              const proxyFeedImage = new URL(
                '/api/images/proxy',
                process.env.NEXT_PUBLIC_BASE_URL
              );

              proxyFeedImage.searchParams.set('url', image ?? '');

              return (
                <Stack key={feedId} kind="flexRow" space="small" align="center">
                  <Artwork
                    width={80}
                    height={80}
                    src={proxyFeedImage.toString()}
                  />
                  <Stack space="small">
                    <Typography as="h2" size="headingSmaller">
                      <Link
                        className={headingLink}
                        href={getPodcastPath({ id: `${feedId}` })}
                      >
                        {title}
                      </Link>
                    </Typography>
                  </Stack>
                </Stack>
              );
            })}
          </Stack>
        )}
      </Stack>
    </>
  );
};

export default HomePage;
