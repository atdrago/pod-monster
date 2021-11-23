import type { FunctionComponent } from 'react';

import { Typography } from 'components/atoms/Typography';
import { Stack } from 'components/layouts/Stack';
import { useUniqueId } from 'hooks/useUniqueId';
import { TextAreaProps } from 'types';

import { textArea, textareaInputGroup } from './textArea.css';

export const TextArea: FunctionComponent<TextAreaProps> = ({
  label,
  value,
  ...textAreaProps
}) => {
  const id = useUniqueId();

  return (
    <Stack
      kind="grid"
      maxWidth="small"
      space="small"
      className={textareaInputGroup}
      data-value={value}
    >
      <Typography as="label" size="paragraph" htmlFor={id}>
        {label}
      </Typography>
      <textarea className={textArea} id={id} value={value} {...textAreaProps} />
    </Stack>
  );
};
