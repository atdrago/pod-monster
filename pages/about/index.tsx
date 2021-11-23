import type { GetStaticProps } from 'next';
import Head from 'next/head';
import type { FunctionComponent } from 'react';

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
      <Head>
        <title>About - podcast.fish</title>
        <meta
          name="description"
          content="Hello, and welcome to podcast.fish!"
        />
      </Head>
      <Header />
      <Stack as="main">
        <Typography as="p" size="paragraph">
          Hello, and welcome to podcast.fish!
        </Typography>
      </Stack>
    </>
  );
};

export default AboutPage;
