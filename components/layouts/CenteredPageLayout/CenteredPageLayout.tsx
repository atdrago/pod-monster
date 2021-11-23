import { Box, PolymorphicComponent } from 'react-polymorphic-box';

import { useClassNames } from 'hooks/useClassNames';
import { centeredPageLayout } from 'styles';

export const CenteredPageLayout: PolymorphicComponent<unknown> = ({
  className,
  ...divProps
}) => {
  const rootClassName = useClassNames(centeredPageLayout, className);

  return <Box as="div" className={rootClassName} {...divProps} />;
};
