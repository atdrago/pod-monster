import 'styles/app.css';

import { LazyMotion, domAnimation } from 'framer-motion';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { FunctionComponent, useState } from 'react';
import { Hydrate, QueryClient, QueryClientProvider } from 'react-query';

import { CenteredPageLayout } from 'components/layouts/CenteredPageLayout';
import { Footer } from 'components/molecules/Footer';
import { Header } from 'components/molecules/Header';
import { MediaPlayer } from 'components/organisms/MediaPlayer';
import { MediaProvider } from 'contexts/MediaContext';
import { SettingsProvider } from 'contexts/SettingsContext';
import { useGlobalVhCssVariable } from 'hooks/useGlobalVhCssVariable';
import type { IEpisodePageProps, IPodcastPageProps } from 'types';

const isEpisodePage = (props?: unknown): props is IEpisodePageProps => {
  if (typeof props !== 'object' || props === null) {
    return false;
  }

  return 'episode' in props;
};

const isPodcastPage = (props?: unknown): props is IPodcastPageProps => {
  if (typeof props !== 'object' || props === null) {
    return false;
  }

  return 'episodes' in props && 'feed' in props;
};

const App: FunctionComponent<AppProps> = ({ Component, pageProps }) => {
  useGlobalVhCssVariable();

  const { isFallback } = useRouter();

  const [queryClient] = useState(() => new QueryClient());

  let feedId;
  let feedTitle;
  let episodeId;
  let episodeTitle;

  if (isPodcastPage(pageProps)) {
    const feed = pageProps.feed;

    feedId = feed.id;
    feedTitle = feed.title;
  } else if (isEpisodePage(pageProps)) {
    const episode = pageProps.episode;

    episodeId = episode?.id;
    episodeTitle = episode?.title;
    feedTitle = episode?.feedTitle;
    feedId = episode?.feedId;
  }

  return (
    <SettingsProvider>
      <QueryClientProvider client={queryClient}>
        <Hydrate state={pageProps.dehydratedState}>
          <LazyMotion features={domAnimation}>
            <MediaProvider>
              <CenteredPageLayout>
                <Header
                  feedId={feedId}
                  feedTitle={feedTitle}
                  isLoading={isFallback}
                  episodeId={episodeId}
                  episodeTitle={episodeTitle}
                />
                <Component {...pageProps} />
                <MediaPlayer />
                <Footer />
              </CenteredPageLayout>
            </MediaProvider>
          </LazyMotion>
        </Hydrate>
      </QueryClientProvider>
    </SettingsProvider>
  );
};

export default App;
