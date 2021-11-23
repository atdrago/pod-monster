import type { FunctionComponent } from 'react';

import { useClassNames } from 'hooks/useClassNames';

import { nav } from './nav.css';

export const Nav: FunctionComponent<JSX.IntrinsicElements['nav']> = ({
  className,
  ...navProps
}) => {
  const rootClassName = useClassNames(nav, className);

  return <nav className={rootClassName} {...navProps} />;
};
