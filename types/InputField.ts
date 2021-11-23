export type InputFieldProps = JSX.IntrinsicElements['input'] & {
  feedback?: string | null;
  label: string;
  type?: 'date' | 'search' | 'text' | 'time';
};
