import { useTypography } from 'components/atoms/Typography';
import { useClassNames } from 'hooks/useClassNames';

import { labelClassName, selectClassName } from './selectField.css';

interface ISelectFieldOptionProps {
  label: string;
  value: string | number;
}

export const SelectField = ({
  children,
  className,
  value,
  ...props
}: JSX.IntrinsicElements['select']) => {
  const typographyClassName = useTypography({
    className,
    shouldUseCapsize: false,
    size: 'paragraph',
  });
  const labelBaseClassName = useClassNames(labelClassName, typographyClassName);

  return (
    <label className={labelBaseClassName}>
      <select className={selectClassName} value={value} {...props}>
        {children}
      </select>
      {value}x
    </label>
  );
};

export const SelectFieldOption = ({
  label,
  value,
}: ISelectFieldOptionProps) => {
  return (
    <option key={value} value={value}>
      {label}
    </option>
  );
};
