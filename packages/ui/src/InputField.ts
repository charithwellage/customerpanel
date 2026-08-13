export interface InputFieldProps {
  id: string;
  label: string;
  type?: 'text' | 'email' | 'number' | 'password' | 'search';
  value?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

export function renderInputFieldSkeleton(props: InputFieldProps): {
  id: string;
  labelId: string;
  errorId?: string;
  hasError: boolean;
} {
  return {
    id: props.id,
    labelId: `${props.id}-label`,
    errorId: props.error ? `${props.id}-error` : undefined,
    hasError: Boolean(props.error),
  };
}
