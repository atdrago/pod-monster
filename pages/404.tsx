import Head from 'next/head';
import type { FunctionComponent } from 'react';

import { Typography } from 'components/atoms/Typography';
import { Stack } from 'components/layouts/Stack';
import { Header } from 'components/molecules/Header';

const NotFound: FunctionComponent = () => {
  return (
    <>
      <Head>
        <title>404 - Not found - {process.env.NEXT_PUBLIC_APP_NAME}</title>
        <meta name="description" content="404 - Not found" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header />
      <Stack as="main">
        <Typography as="h2" size="headingMedium">
          404 - Not found
        </Typography>
        <Typography as="p" size="paragraph">
          Sorry, I&apos;m not sure what you were looking for, but if it ever
          existed, it doesn&apos;t anymore.
        </Typography>
        <Typography as="p" size="paragraph">
          Hopefully I didn&apos;t break something...
        </Typography>
      </Stack>
    </>
  );
};

export default NotFound;
