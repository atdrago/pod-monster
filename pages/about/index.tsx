import type { GetStaticProps } from 'next';
import type { FunctionComponent, ReactNode } from 'react';

import { Head } from 'components/atoms/Head';
import { Link } from 'components/atoms/Link';
import { Typography } from 'components/atoms/Typography';
import { Stack } from 'components/layouts/Stack';
import { headingLink, listItem, listLayout, underlinedLink } from 'styles';

export const getStaticProps: GetStaticProps = () => {
  return {
    props: {},
  };
};

enum Heading {
  'Mission',
  'How it works',
  'Releases',
  'Principles',
  'Known Issues',
  'Technologies',
}

const HeadingAnchor = ({ label }: { label?: keyof typeof Heading }) => {
  const slug = label?.replace(/\W+/g, '-').toLowerCase();

  // If the slug is empty or undefined, don't render an anchor. Instead, return
  // the label as-is.
  if (!slug) {
    return <>label</>;
  }

  return (
    <a className={headingLink} href={`#${slug}`} id={slug}>
      {label}
    </a>
  );
};

const HeadingAnchorLink = ({
  children,
  to,
}: {
  children?: ReactNode;
  to: keyof typeof Heading;
}) => {
  const slug = to?.replace(/\W+/g, '-').toLowerCase();

  // If the slug is empty or undefined, don't render an anchor. Instead, return
  // the label as-is.
  if (!slug) {
    return <>label</>;
  }

  return (
    <a className={underlinedLink} href={`#${slug}`}>
      {children}
    </a>
  );
};

const ExternalLink = ({
  children,
  href,
}: {
  children?: ReactNode;
  href: string;
}) => {
  return (
    <a
      className={underlinedLink}
      target="_blank"
      href={href}
      rel="noreferrer noopener"
    >
      {children}
    </a>
  );
};

const AboutPage: FunctionComponent = () => {
  return (
    <>
      <Head
        titles={['About']}
        description={`Hello, and welcome to ${process.env.NEXT_PUBLIC_APP_NAME}!`}
      />
      <Stack as="main">
        <Typography as="h3" size="headingMedium">
          Pod Monster
        </Typography>
        <Stack as="section">
          <Typography as="h3" size="headingSmall">
            <HeadingAnchor label="Mission" />
          </Typography>
          <Typography as="p" size="paragraph">
            Pod Monster is a consumer-focused, web-first, mobile-first
            application that aims at creating an accessible, lightweight,
            straightforward, and uncomplicated experience to manage and consume
            podcasts.
          </Typography>
        </Stack>
        <Stack as="section">
          <Typography as="h3" size="headingSmall">
            <HeadingAnchor label="How it works" />
          </Typography>
          <Typography as="p" size="paragraph">
            Pod Monster relies on the{' '}
            <ExternalLink href="https://podcastindex.org/">
              Podcast Index
            </ExternalLink>{' '}
            for retrieving all of its data about podcasts to perform things like
            search, podcast lookups, and episode lookups.
          </Typography>
          <Typography as="p" size="paragraph">
            When you &ldquo;subscribe&rdquo; to a podcast, it will appear in
            your &ldquo;
            <Link className={underlinedLink} href={'/'}>
              Subscriptions
            </Link>
            &rdquo; list for easy access. Subscribing is and will always be free
            and private. Currently, settings and subscriptions exist only on
            your device. In the future, you will have the option of creating an
            account that will allow a more reliant layer of persistence (see
            &ldquo;
            <HeadingAnchorLink to="Known Issues">
              Known Issues
            </HeadingAnchorLink>
            &rdquo;) and the synchronization of settings and subscriptions
            between devices.
          </Typography>
        </Stack>
        <Stack as="section">
          <Typography as="h3" size="headingSmall">
            <HeadingAnchor label="Releases" />
          </Typography>
          <Typography as="p" size="paragraph">
            Pod Monster is currently in its &ldquo;alpha&rdquo; phase. This
            means:
          </Typography>
          <Typography
            as="ul"
            className={listLayout}
            size="paragraph"
            shouldUseCapsize={false}
          >
            <li className={listItem}>
              It is available for public testing and use.
            </li>
            <li className={listItem}>
              You can expect all changes that land to be stable.
            </li>
            <li className={listItem}>
              There are core features that have not yet been implemented, and
              the features that have been implemented are subject to frequent
              changes.
            </li>
          </Typography>
        </Stack>
        <Stack as="section">
          <Typography as="h3" size="headingSmall">
            <HeadingAnchor label="Principles" />
          </Typography>
          <Typography
            as="ul"
            className={listLayout}
            size="paragraph"
            shouldUseCapsize={false}
          >
            <li className={listItem}>
              No account is required to subscribe to or listen to podcasts
              (though certain limits may need to be imposed eventually due to
              browser restrictions).
            </li>
            <li className={listItem}>
              None of your usage data or personal information will ever be sold
              to a third party or used to sell you third-party products.
            </li>
            <li className={listItem}>
              The interface is intentionally minimal and plain to prevent
              distractions from information that isn&apos;t relevant to the
              podcast or episode.
            </li>
            <li className={listItem}>
              Every consumer-focused feature of the Podcast Index is in the
              plans, and I will implement them in the order that I see fit.
            </li>
          </Typography>
        </Stack>

        <Stack as="section">
          <Typography as="h3" size="headingSmall">
            <HeadingAnchor label="Known Issues" />
          </Typography>
          <Typography
            as="ul"
            className={listLayout}
            size="paragraph"
            shouldUseCapsize={false}
          >
            <li className={listItem}>
              <Typography as="p" size="paragraph" shouldUseCapsize={false}>
                All settings, including subscriptions, are currently stored in
                LocalStorage, making them reasonably persistent. Unfortunately,
                browser processes like &ldquo;
                <ExternalLink href="https://web.dev/storage-for-the-web/#eviction">
                  data eviction
                </ExternalLink>
                &rdquo; and &ldquo;
                <ExternalLink href="https://webkit.org/blog/9521/intelligent-tracking-prevention-2-3/">
                  Intelligent Tracking Prevention
                </ExternalLink>
                &rdquo;, can clear them at any time.{' '}
                <ExternalLink href="https://web.dev/persistent-storage/#how-is-permission-granted">
                  Using the site often
                </ExternalLink>{' '}
                is a great signal to your web browser that Pod Monster&apos;s
                storage should be persistent. Still, there is no surefire way to
                keep reliably persistent data in a web browser. For this reason,
                I encourage you to{' '}
                <Link className={underlinedLink} href="/">
                  keep an OPML back-up
                </Link>{' '}
                of your subscriptions, just in case your subscriptions get wiped
                out. OPML is also a great way to experiment with different
                podcast apps!
              </Typography>
              <br />
              <Typography as="p" size="paragraph" shouldUseCapsize={false}>
                In the future, the plan is to fix this in two ways. First,
                migrating from LocalStorage to IndexedDB will increase storage
                limits, which should help avoid data eviction. And, second,
                adding user accounts to allow off-device storage and
                synchronization of data between devices.
              </Typography>
            </li>
          </Typography>
        </Stack>
        <Stack as="section">
          <Typography as="h3" size="headingSmall">
            <HeadingAnchor label="Technologies" />
          </Typography>
          <Typography as="p" size="paragraph">
            The following is a list of technologies, projects, or services used
            within this project that I endorse and recommend for others.
          </Typography>
          <Typography
            as="ol"
            className={listLayout}
            size="paragraph"
            shouldUseCapsize={false}
          >
            <li className={listItem}>
              <ExternalLink href="https://podcastindex.org/">
                The Podcast Index
              </ExternalLink>{' '}
              is the open API that provides all the podcast data for this
              application. Pod Monster would not be possible without it. Anytime
              you search for a podcast, browse a podcast feed, or listen to an
              episode, you&apos;re viewing information provided by the Podcast
              Index.
            </li>
            <li className={listItem}>
              <ExternalLink href="https://nextjs.org/">TypeScript</ExternalLink>{' '}
              allows you to write statically-typed JavaScript and, when used in
              strict mode, eliminates an entire category of possible errors.
            </li>
            <li className={listItem}>
              <ExternalLink href="https://nextjs.org/">Next.js</ExternalLink> is
              a framework for building full-stack web applications in React. It
              includes technologies like server-side rendering, static
              generation, incremental static regeneration, API routes, and
              automatic image optimization, all of which make building a
              performant application much more manageable.
            </li>
            <li className={listItem}>
              <ExternalLink href="https://vercel.com/">Vercel</ExternalLink> is
              a performance-focused platform that integrates directly with
              GitHub to allow things like PR preview deployments and main branch
              production deployments with 0 project-based configuration.
            </li>
            <li className={listItem}>
              <ExternalLink href="https://vanilla-extract.style/">
                Vanilla Extract
              </ExternalLink>{' '}
              is a lovely, newer tool for writing CSS styles in TypeScript. It
              automatically scopes classes (like CSS Modules), is type-safe, and
              allows the creation of theme-based contracts that make things like
              dark/light mode support a breeze. It generates all CSS at build
              time, so there is no run time performance implication.
            </li>
            <li className={listItem}>
              <ExternalLink href="https://icomoon.io/">IcoMoon</ExternalLink>{' '}
              lets you hand-pick and download icons, without an account, for
              free (though they also offer paid sets). Except for the logo,
              every SVG icon used within this application is taken directly from
              the &ldquo;
              <ExternalLink href="https://icomoon.io/">
                IcoMoon - Free
              </ExternalLink>
              &rdquo; icon set.
            </li>
          </Typography>
        </Stack>
      </Stack>
    </>
  );
};

export default AboutPage;
