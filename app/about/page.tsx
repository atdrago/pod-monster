import { Metadata } from 'next';

import { ExternalLink } from 'components/atoms/ExternalLink';
import { Typography } from 'components/atoms/Typography';
import { Stack } from 'components/layouts/Stack';
import { createMetadata } from 'utils/createMetadata';

export async function generateMetadata(): Promise<Metadata> {
  return createMetadata({
    description: `Hello, and welcome to Pod Monster!`,
    titles: ['About'],
  });
}

type Heading =
  | 'Mission'
  | 'How it works'
  | 'Releases'
  | 'Principles'
  | 'Technologies';

const HeadingAnchor = ({ label }: { label?: Heading }) => {
  const slug = label?.replace(/\W+/g, '-').toLowerCase();

  // If the slug is empty or undefined, don't render an anchor. Instead, return
  // the label as-is.
  if (!slug) {
    return <>label</>;
  }

  return (
    <a className="no-underline hover:underline" href={`#${slug}`} id={slug}>
      {label}
    </a>
  );
};

export default function Page() {
  return (
    <Stack as="main">
      <Typography as="h3" className="font-bold" size="headingMedium">
        Pod Monster
      </Typography>
      <Stack as="section">
        <Typography as="h3" className="font-bold" size="headingSmall">
          <HeadingAnchor label="Mission" />
        </Typography>
        <Typography as="p" size="paragraph">
          Pod Monster is a consumer-focused, web-first, mobile-first application
          that aims at creating an accessible, lightweight, straightforward, and
          uncomplicated experience to manage and consume podcasts.
        </Typography>
      </Stack>
      <Stack as="section">
        <Typography as="h3" className="font-bold" size="headingSmall">
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
      </Stack>
      <Stack as="section">
        <Typography as="h3" className="font-bold" size="headingSmall">
          <HeadingAnchor label="Releases" />
        </Typography>
        <Typography as="p" size="paragraph">
          Pod Monster is currently in its &ldquo;alpha&rdquo; phase. This means:
        </Typography>
        <Typography
          as="ul"
          className="list-layout"
          size="paragraph"
          shouldTrimTextBox={false}
        >
          <li>It is available for public testing and use.</li>
          <li>You can expect all changes that land to be stable.</li>
          <li>
            There are core features that have not yet been implemented, and the
            features that have been implemented are subject to frequent changes.
          </li>
        </Typography>
      </Stack>
      <Stack as="section">
        <Typography as="h3" className="font-bold" size="headingSmall">
          <HeadingAnchor label="Principles" />
        </Typography>
        <Typography
          as="ul"
          className="list-layout"
          size="paragraph"
          shouldTrimTextBox={false}
        >
          <li>
            No account is required to listen to podcasts (though certain limits
            may need to be imposed eventually due to browser restrictions).
          </li>
          <li>
            None of your usage data or personal information will ever be sold to
            a third party or used to sell you third-party products.
          </li>
          <li>
            The interface is intentionally minimal and plain to prevent
            distractions from information that isn&apos;t relevant to the
            podcast or episode.
          </li>
          <li>
            Wherever possible, the interface uses standard, native web controls
            in place of custom JavaScript-based controls. The goal is to give
            you an accessible experience that feels familiar and comfortable,
            not custom.
          </li>
          <li>
            Every consumer-focused feature of the Podcast Index is in the plans,
            and I will implement them in the order that I see fit.
          </li>
        </Typography>
      </Stack>
      <Stack as="section">
        <Typography as="h3" className="font-bold" size="headingSmall">
          <HeadingAnchor label="Technologies" />
        </Typography>
        <Typography as="p" size="paragraph">
          The following is a list of technologies, projects, or services used
          within this project that I endorse and recommend for others.
        </Typography>
        <Typography
          as="ol"
          className="list-layout"
          size="paragraph"
          shouldTrimTextBox={false}
        >
          <li>
            <ExternalLink href="https://podcastindex.org/">
              The Podcast Index
            </ExternalLink>{' '}
            is the open API that provides all the podcast data for this
            application. Pod Monster would not be possible without it. Anytime
            you search for a podcast, browse a podcast feed, or listen to an
            episode, you&apos;re viewing information provided by the Podcast
            Index.
          </li>
          <li>
            <ExternalLink href="https://www.typescriptlang.org/">
              TypeScript
            </ExternalLink>{' '}
            allows you to write statically-typed JavaScript and, when used in
            strict mode, eliminates an entire category of possible errors.
          </li>
          <li>
            <ExternalLink href="https://nextjs.org/">Next.js</ExternalLink> is a
            framework for building full-stack web applications in React. It
            includes technologies like server-side rendering, static generation,
            incremental static regeneration, API routes, and automatic image
            optimization, all of which make building a performant application
            much more manageable.
          </li>
          <li>
            <ExternalLink href="https://vercel.com/">Vercel</ExternalLink> is a
            performance-focused platform that integrates directly with GitHub to
            allow things like PR preview deployments and main branch production
            deployments with 0 project-based configuration.
          </li>
          <li>
            <ExternalLink href="https://tailwindcss.com/">
              Tailwind CSS
            </ExternalLink>{' '}
            is a utility-first CSS framework, which means you style each element
            with small, single-purpose classes right in the markup. Its theme
            keeps colors, type sizes, and spacing in one place, which makes
            things like light and dark mode much easier to manage. It generates
            the CSS at build time, so there&apos;s no run time performance cost.
          </li>
          <li>
            <ExternalLink href="https://icomoon.io/">IcoMoon</ExternalLink> lets
            you hand-pick and download icons, without an account, for free
            (though they also offer paid sets). Except for the logo, every SVG
            icon used within this application is taken directly from the &ldquo;
            <ExternalLink href="https://icomoon.io/">
              IcoMoon - Free
            </ExternalLink>
            &rdquo; icon set.
          </li>
        </Typography>
      </Stack>
    </Stack>
  );
}
