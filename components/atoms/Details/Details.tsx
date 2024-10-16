'use client';

import { type ReactNode, useState } from 'react';

import { Icon } from 'components/atoms/Icon';
import { Stack } from 'components/layouts/Stack';
import PlayIcon from 'icons/play3.svg';
import SpinnerIcon from 'icons/spinner8.svg';
import WarningIcon from 'icons/warning.svg';

import {
  articleClassName,
  footerClassName,
  summaryClassName,
} from './details.css';

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
        className={summaryClassName}
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
      {children && <article className={articleClassName}>{children}</article>}
      {footer && <div className={footerClassName}>{footer}</div>}
    </details>
  );
};
