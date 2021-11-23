import type { FunctionComponent } from 'react';

import { Stack } from 'components/layouts/Stack';

export const Form: FunctionComponent<JSX.IntrinsicElements['form']> = ({
  className,
  ...formProps
}) => {
  return <Stack as="form" className={className} {...formProps} />;
};
