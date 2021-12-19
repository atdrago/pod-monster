import type { FunctionComponent } from 'react';

import { blockquote } from 'components/atoms/Typography';
import { useClassNames } from 'hooks/useClassNames';

export const Blockquote: FunctionComponent<
  JSX.IntrinsicElements['blockquote']
> = ({ className, ...blockquoteProps }) => {
  const rootClassName = useClassNames(blockquote, className);

  return <blockquote className={rootClassName} {...blockquoteProps} />;
};
