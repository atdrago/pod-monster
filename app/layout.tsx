import 'styles/app.css';
import 'styles/globals.css';

import { Viewport } from 'next';

import { CenteredPageLayout } from 'components/layouts/CenteredPageLayout';
import { AnotherTabNotice } from 'components/molecules/AnotherTabNotice';
import { Footer } from 'components/molecules/Footer';
import { MediaPlayer } from 'components/organisms/MediaPlayer';
import { vars } from 'styles';

import { Providers } from './Providers';
import { VercelInsights } from './VercelInsights';

export const viewport: Viewport = {
  themeColor: vars.color.background,
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
