import { useClassNames } from 'hooks/useClassNames';
import { underlinedLink } from 'styles';

export const ExternalLink = ({
  children,
  className: classNameProp,
  ...props
}: JSX.IntrinsicElements['a']) => {
  const className = useClassNames(underlinedLink, classNameProp);

  return (
    <a
      className={className}
      target="_blank"
      rel="noreferrer noopener"
      {...props}
    >
      {children}
    </a>
  );
};
