import { FunctionComponent, useState } from 'react';

import { Icon } from 'components/atoms/Icon';
import { Stack } from 'components/layouts/Stack';
import { useClassNames } from 'hooks/useClassNames';
import PlayIcon from 'icons/play3.svg';
import { DetailsProps } from 'types';

import {
  articleClassName,
  footerClassName,
  summaryClassName,
} from './details.css';

export const Details: FunctionComponent<DetailsProps> = ({
  children,
  footer,
  summary,
  ...detailsProps
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const baseSummaryClassName = useClassNames(summaryClassName);

  return (
    <details {...detailsProps}>
      <Stack
        as="summary"
        className={baseSummaryClassName}
        kind="flexRow"
        onClick={() => setIsOpen(!isOpen)}
        space="small"
      >
        <Icon
          as={PlayIcon}
          size="xsmall"
          orientation={isOpen ? 'rotate90' : 'default'}
        />
        {summary}
      </Stack>
      <article className={articleClassName}>{children}</article>
      {footer && <div className={footerClassName}>{footer}</div>}
    </details>
  );
};
