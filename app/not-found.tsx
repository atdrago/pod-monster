import { Metadata } from 'next';

import { Typography } from 'components/atoms/Typography';
import { Stack } from 'components/layouts/Stack';
import { Header } from 'components/molecules/Header';
import { createMetadata } from 'utils/createMetadata';

export function generateMetadata(): Promise<Metadata> {
  return createMetadata({
    description: '404 - Not found',
    titles: ['404', 'Not found'],
  });
}

export default function NotFound() {
  return (
    <>
      <Header />
      <Stack as="main">
        <Typography as="h2" size="headingMedium" className="font-bold">
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
}
