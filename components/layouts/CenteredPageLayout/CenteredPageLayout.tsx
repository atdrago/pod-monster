import { PolymorphicComponent } from 'react-polymorphic-box';

import { Stack } from 'components/layouts/Stack';
import { useClassNames } from 'hooks/useClassNames';

import { centeredPageLayout } from './centeredPageLayout.css';

export const CenteredPageLayout: PolymorphicComponent<unknown> = ({
  className,
  ...divProps
}) => {
  const rootClassName = useClassNames(centeredPageLayout, className);

  return (
    <Stack
      as="div"
      align="center"
      justify="center"
      className={rootClassName}
      space="medium"
      {...divProps}
    />
  );
};
