import type { GetStaticProps } from 'next';
import Head from 'next/head';
import type { FunctionComponent } from 'react';

import { Header } from 'components/molecules/Header';

export const getStaticProps: GetStaticProps = () => {
  return {
    props: {},
  };
};

const HomePage: FunctionComponent = () => {
  return (
    <>
      <Head>
        <title>podcast.fish</title>
        <meta name="description" content="A front-end to the Podcast Index." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header />
    </>
  );
};

export default HomePage;
