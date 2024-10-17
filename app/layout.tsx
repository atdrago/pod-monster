import 'styles/app.css';

import { Viewport } from 'next';

import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/react';
import { CenteredPageLayout } from 'components/layouts/CenteredPageLayout';
import { Footer } from 'components/molecules/Footer';
import { MediaPlayer } from 'components/organisms/MediaPlayer';
import { vars } from 'styles';

import { Providers } from './providers';

export const viewport: Viewport = {
  themeColor: vars.color.background,
};

export default function RootLayout({ children }: React.PropsWithChildren) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <CenteredPageLayout>
            {children}
            <MediaPlayer />
            <Footer />
          </CenteredPageLayout>
        </Providers>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
