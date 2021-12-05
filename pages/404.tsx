import type { FunctionComponent } from 'react';

import { Head } from 'components/atoms/Head';
import { Typography } from 'components/atoms/Typography';
import { Stack } from 'components/layouts/Stack';
import { Header } from 'components/molecules/Header';

const NotFound: FunctionComponent = () => {
  return (
    <>
      <Head titles={['404', 'Not found']} description="404 - Not found" />
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
