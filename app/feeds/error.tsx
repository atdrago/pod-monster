'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

import { Button } from 'components/atoms/Button';
import { Typography } from 'components/atoms/Typography';
import { Stack } from 'components/layouts/Stack';
import { Header } from 'components/molecules/Header';

interface FeedErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Shows a transient failure of a `/feeds/` page, for example a feed host that
 * does not answer in time. This boundary keeps the root layout, so the player
 * does not stop.
 */
export default function FeedError({ reset }: FeedErrorProps) {
  const router = useRouter();
  const [isRetryPending, startRetryTransition] = useTransition();

  // `reset()` alone renders the page again from the same server payload.
  // `router.refresh()` runs the server loader again.
  const handleTryAgainClick = () => {
    if (isRetryPending) {
      return;
    }

    startRetryTransition(() => {
      router.refresh();
      reset();
    });
  };

  return (
    <>
      <Header />
      <Stack as="main">
        <Typography as="h2" size="headingMedium" className="font-bold">
          We couldn&apos;t load this podcast right now
        </Typography>
        <Typography as="p" size="paragraph">
          This is often temporary, so please try again in a moment.
        </Typography>
        <Button disabled={isRetryPending} onClick={handleTryAgainClick}>
          Try again
        </Button>
      </Stack>
    </>
  );
}
