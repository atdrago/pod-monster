import type { GetStaticProps } from 'next';
import type { FunctionComponent } from 'react';

import { Head } from 'components/atoms/Head';
import { Typography } from 'components/atoms/Typography';
import { Stack } from 'components/layouts/Stack';
import { Header } from 'components/molecules/Header';

export const getStaticProps: GetStaticProps = () => {
  return {
    props: {},
  };
};

const AboutPage: FunctionComponent = () => {
  return (
    <>
      <Head
        titles={['About']}
        description={`Hello, and welcome to ${process.env.NEXT_PUBLIC_APP_NAME}!`}
      />
      <Header />
      <Stack as="main">
        <Typography as="p" size="paragraph">
          Hello, and welcome to {process.env.NEXT_PUBLIC_APP_NAME}!
        </Typography>
      </Stack>
    </>
  );
};

export default AboutPage;
