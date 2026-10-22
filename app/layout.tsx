import 'styles/globals.css';

import { Viewport } from 'next';

import { CenteredPageLayout } from 'components/layouts/CenteredPageLayout';
import { AnotherTabNotice } from 'components/molecules/AnotherTabNotice';
import { Footer } from 'components/molecules/Footer';
import { MediaPlayer } from 'components/organisms/MediaPlayer';

import { Providers } from './Providers';
import { VercelInsights } from './VercelInsights';

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { color: '#d0d0d0', media: '(prefers-color-scheme: light)' },
    { color: '#272822', media: '(prefers-color-scheme: dark)' },
  ],
};

export default function RootLayout({ children }: React.PropsWithChildren) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <CenteredPageLayout>
            <AnotherTabNotice />
            {children}
            <MediaPlayer />
            <Footer />
          </CenteredPageLayout>
        </Providers>
        <VercelInsights />
      </body>
    </html>
  );
}
