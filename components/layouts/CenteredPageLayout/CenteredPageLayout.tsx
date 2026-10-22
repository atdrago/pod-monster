import { PolymorphicComponent } from 'react-polymorphic-box';

import { Stack } from 'components/layouts/Stack';

export const CenteredPageLayout: PolymorphicComponent<unknown> = ({
  className,
  ...divProps
}) => (
  <Stack
    as="div"
    align="center"
    justify="center"
    className={`min-h-dvh px-4 py-8 ${className ?? ''}`}
    maxWidth="page"
    space="medium"
    {...divProps}
  />
);
