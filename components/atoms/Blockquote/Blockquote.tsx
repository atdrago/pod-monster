import type { FunctionComponent, JSX } from 'react';

import { blockquote } from 'styles';
import { useClassNames } from 'hooks/useClassNames';

export const Blockquote: FunctionComponent<
  JSX.IntrinsicElements['blockquote']
> = ({ className, ...blockquoteProps }) => {
  const rootClassName = useClassNames(blockquote, className);

  return <blockquote className={rootClassName} {...blockquoteProps} />;
};
