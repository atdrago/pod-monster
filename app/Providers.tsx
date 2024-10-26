'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { LazyMotion, domAnimation } from 'framer-motion';

import { MediaProvider } from 'contexts/MediaContext';
import { SettingsProvider } from 'contexts/SettingsContext';
import { useGlobalVhCssVariable } from 'hooks/useGlobalVhCssVariable';
import { getQueryClient } from 'utils/getQueryClient';

export const Providers = ({ children }: React.PropsWithChildren) => {
  useGlobalVhCssVariable();
  // NOTE: Avoid useState when initializing the query client if you don't
  //       have a suspense boundary between this and the code that may
  //       suspend because React will throw away the client on the initial
  //       render if it suspends and there is no boundary
  const queryClient = getQueryClient();

  return (
    <SettingsProvider>
      <QueryClientProvider client={queryClient}>
        <LazyMotion features={domAnimation}>
          <MediaProvider>{children}</MediaProvider>
        </LazyMotion>
      </QueryClientProvider>
    </SettingsProvider>
  );
};
