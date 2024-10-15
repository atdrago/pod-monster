import { useTypography } from 'components/atoms/Typography';
import { useClassNames } from 'hooks/useClassNames';

import { labelClassName, selectClassName } from './selectField.css';

interface SelectFieldOptionProps {
  label: string;
  value: string | number;
}

type SelectFieldProps = JSX.IntrinsicElements['select'] & {
  label?: string;
};

export const SelectField = ({
  children,
  className,
  label,
  value,
  ...props
}: SelectFieldProps) => {
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
      {label ?? value}
    </label>
  );
};

export const SelectFieldOption = ({ label, value }: SelectFieldOptionProps) => {
  return (
    <option key={value} value={value}>
      {label}
    </option>
  );
};
