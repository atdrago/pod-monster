import 'styles/app.css';

import type { AppProps } from 'next/app';
import type { FunctionComponent } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';

import { CenteredPageLayout } from 'components/layouts/CenteredPageLayout';
import { AudioPlayer } from 'components/molecules/AudioPlayer';
import { AudioProvider } from 'contexts/AudioContext';
import { SettingsProvider } from 'contexts/SettingsContext';
import { useGlobalVhCssVariable } from 'hooks/useGlobalVhCssVariable';

const queryClient = new QueryClient();

const App: FunctionComponent<AppProps> = ({ Component, pageProps }) => {
  useGlobalVhCssVariable();

  return (
    <SettingsProvider>
      <QueryClientProvider client={queryClient}>
        <AudioProvider>
          <CenteredPageLayout>
            <Component {...pageProps} />
            <AudioPlayer />
          </CenteredPageLayout>
        </AudioProvider>
      </QueryClientProvider>
    </SettingsProvider>
  );
};

export default App;
