import type { Metadata } from 'next';

import { Header } from 'components/molecules/Header';
import { createMetadata } from 'utils/createMetadata';

import { SettingsPage } from './SettingsPage';

export function generateMetadata(): Promise<Metadata> {
  return createMetadata({
    description: 'Pod Monster settings',
    titles: ['Settings'],
  });
}

export default function Page() {
  return (
    <>
      <Header />
      <SettingsPage />
    </>
  );
}
