'use client';

import { type ReactNode, useState, type JSX } from 'react';

import { Icon } from 'components/atoms/Icon';
import { Stack } from 'components/layouts/Stack';
import PlayIcon from 'icons/play3.svg';
import SpinnerIcon from 'icons/spinner8.svg';
import WarningIcon from 'icons/warning.svg';

type DetailsProps = JSX.IntrinsicElements['details'] & {
  footer?: ReactNode;
  hasError?: boolean;
  isLoading?: boolean;
  summary: ReactNode;
};

export const Details = ({
  children,
  footer,
  hasError,
  isLoading,
  summary,
  ...detailsProps
}: DetailsProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <details {...detailsProps}>
      <Stack
        as="summary"
        className="cursor-pointer outline-none text-foreground [&::marker]:hidden [&::-webkit-details-marker]:hidden"
        kind="flexRow"
        onClick={() => setIsOpen(!isOpen)}
        space="small"
      >
        {/**
         * Only show the loading indicator if it's still loading when the
         * details element is open. This prevents providing too much unnecessary
         * feedback. The user only cares that it's loading if they're trying to
         * look at the contents.
         */}
        {isLoading && isOpen ? (
          <Icon as={SpinnerIcon} size="xsmall" orientation="spinning" />
        ) : hasError ? (
          <Icon as={WarningIcon} size="xsmall" />
        ) : (
          <Icon
            as={PlayIcon}
            size="xsmall"
            orientation={isOpen ? 'rotate90' : 'default'}
          />
        )}
        {summary}
      </Stack>
      {children ? (
        <article
          className={`
            border-l-12 border-foreground-light dark:border-foreground-dark
            mt-6 pl-6
          `}
        >
          {children}
        </article>
      ) : null}
      {footer ? <div className="mt-6">{footer}</div> : null}
    </details>
  );
};
