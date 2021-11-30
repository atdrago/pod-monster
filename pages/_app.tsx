import 'styles/app.css';

import type { AppProps } from 'next/app';
import { FunctionComponent, useState } from 'react';
import { Hydrate, QueryClient, QueryClientProvider } from 'react-query';

import { CenteredPageLayout } from 'components/layouts/CenteredPageLayout';
import { AudioPlayer } from 'components/molecules/AudioPlayer';
import { AudioProvider } from 'contexts/AudioContext';
import { SettingsProvider } from 'contexts/SettingsContext';
import { useGlobalVhCssVariable } from 'hooks/useGlobalVhCssVariable';

const App: FunctionComponent<AppProps> = ({ Component, pageProps }) => {
  const [queryClient] = useState(() => new QueryClient());

  useGlobalVhCssVariable();

  return (
    <SettingsProvider>
      <QueryClientProvider client={queryClient}>
        <Hydrate state={pageProps.dehydratedState}>
          <AudioProvider>
            <CenteredPageLayout>
              <Component {...pageProps} />
              <AudioPlayer />
            </CenteredPageLayout>
          </AudioProvider>
        </Hydrate>
      </QueryClientProvider>
    </SettingsProvider>
  );
};

export default App;
